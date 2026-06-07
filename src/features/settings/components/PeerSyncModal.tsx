import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/core/store';
import { db } from '@/core/db/db';
import {
  Laptop,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import {
  deriveSyncKey,
  encryptPayload,
  decryptPayload,
  type SyncPayload,
} from '@/lib/core/syncEngine';

interface SignalingMessage {
  type: string;
  room: string;
  sender: string;
  sdp?: RTCSessionDescriptionInit;
  ice?: RTCIceCandidateInit;
}

interface PeerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PeerSyncModal({ isOpen, onClose }: PeerSyncModalProps) {
  const [mode, setMode] = useState<'select' | 'host' | 'client'>('select');
  const [pin, setPin] = useState<string>('');
  const [pinInput, setPinInput] = useState<string[]>(Array(6).fill(''));
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'syncing' | 'completed' | 'error'
  >('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const importSyncData = useStore((s) => s.importSyncData);

  const addLog = (msg: string, type: 'info' | 'success' | 'err' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const prefix = type === 'success' ? '✓' : type === 'err' ? '✗' : 'ℹ';
    setLogs((prev) => [...prev, `[${time}] ${prefix} ${msg}`]);
  };

  // Generate 6-digit pin for Host
  const startHost = async () => {
    setMode('host');
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(generatedPin);
    setStatus('connecting');
    setLogs([]);
    addLog(`Initializing Host Mode with pairing PIN: ${generatedPin}`);
    await setupConnection(generatedPin, true);
  };

  // Start Client pairing with PIN entered
  const startClient = async (enteredPin: string) => {
    setStatus('connecting');
    setLogs([]);
    addLog(`Initializing Client Mode, pairing with PIN: ${enteredPin}`);
    await setupConnection(enteredPin, false);
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setMode('select');
      setPin('');
      setPinInput(Array(6).fill(''));
      setStatus('idle');
      setLogs([]);
      setErrorMessage('');
    }
    return () => cleanup();
  }, [isOpen]);

  // Compute a secure SHA-256 hash room ID from the pairing PIN
  const deriveRoomId = async (pinCode: string): Promise<string> => {
    const pairingSalt =
      ((import.meta as unknown as { env?: Record<string, unknown> }).env
        ?.VITE_PAIRING_SALT as string) || '-titan-pairing-salt-2026';
    const buffer = new TextEncoder().encode(pinCode + pairingSalt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  };

  // Main peer-to-peer WebRTC connection flow
  const setupConnection = async (pinCode: string, isHost: boolean) => {
    try {
      cleanup();

      const roomId = await deriveRoomId(pinCode);
      const saltBytes = new TextEncoder().encode(roomId); // Shared-secret salt derived locally
      const cryptoKey = await deriveSyncKey(pinCode, saltBytes);

      addLog('Deriving secure zero-knowledge AES-256 keys...');

      // Establish RTCPeerConnection using public Google STUN servers
      let iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
      const iceServersEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env
        ?.VITE_ICE_SERVERS as string;
      if (iceServersEnv) {
        try {
          iceServers = JSON.parse(iceServersEnv) as RTCIceServer[];
        } catch {
          // Keep default
        }
      }

      const pc = new RTCPeerConnection({
        iceServers,
      });
      pcRef.current = pc;

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'publish',
              room: roomId,
              sender: isHost ? 'host' : 'client',
              ice: event.candidate,
            }),
          );
        }
      };

      pc.onconnectionstatechange = () => {
        addLog(`WebRTC Connection State changed to: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          setStatus('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setStatus('error');
          setErrorMessage('Peer-to-Peer connection lost.');
          addLog('WebRTC peer link failed.', 'err');
        }
      };

      // Set up signaling websocket
      const signalingUrl =
        ((import.meta as unknown as { env?: Record<string, unknown> }).env
          ?.VITE_SIGNALING_SERVER as string) || 'wss://signaling.yjs.dev';
      const ws = new WebSocket(signalingUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('Connected to public signaling relay.');
        ws.send(JSON.stringify({ type: 'join-room', room: roomId }));
        addLog('Listening for pairing handshake...');
      };

      ws.onerror = () => {
        addLog('Signaling relay WebSocket encountered an error.', 'err');
      };

      ws.onmessage = async (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string) as SignalingMessage;
          if (!msg || msg.room !== roomId || msg.sender === (isHost ? 'host' : 'client')) {
            return;
          }

          if (msg.sdp) {
            addLog(`Received SDP ${msg.sdp.type} offer/answer...`);
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));

            if (msg.sdp.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(
                JSON.stringify({
                  type: 'publish',
                  room: roomId,
                  sender: 'client',
                  sdp: answer,
                }),
              );
              addLog('Created and relayed SDP answer description.');
            }
          } else if (msg.ice) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.ice));
          }
        } catch {
          // Error handled by UI feedback
        }
      };

      const handleChannel = (channel: RTCDataChannel) => {
        channelRef.current = channel;

        channel.onopen = async () => {
          setStatus('syncing');
          addLog('Direct Peer-to-Peer channel established successfully!', 'success');
          addLog('Beginning Zero-Knowledge database payload sync...');

          if (isHost) {
            try {
              // Host gathers database, encrypts and transmits to Client
              addLog('Host: Extracting local database tables...');
              const state = useStore.getState();
              const payload: SyncPayload = {
                tasks: state.tasks,
                notes: state.notes,
                expenses: state.expenses,
                budgets: state.budgets,
                accounts: state.accounts,
                friends: state.friends,
                groups: state.groups,
                sharedExpenses: state.sharedExpenses,
                focusSessions: state.focusSessions,
                tombstones: await db.syncTombstones.toArray(),
              };

              addLog('Host: Encrypting database payload with AES-GCM-256...');
              const encrypted = await encryptPayload(payload, cryptoKey);
              addLog('Host: Sending encrypted envelope...');
              channel.send(JSON.stringify(encrypted));
              addLog('Host: Payload sent, waiting for client response...');
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              addLog(`Host Encryption/Send failed: ${message}`, 'err');
              setStatus('error');
              setErrorMessage(message);
            }
          }
        };

        channel.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data as string) as { cipher: number[]; iv: number[] };
            if (data.cipher && data.iv) {
              addLog('Peer: Encrypted packet received. Authenticating & Decrypting...', 'success');
              const decrypted = (await decryptPayload(
                data.cipher,
                cryptoKey,
                data.iv,
              )) as SyncPayload;
              addLog('Peer: AES-GCM Decryption successful. Parsing payload...');

              if (!isHost) {
                // Client merges Host data first, then replies with Client data
                addLog('Client: Applying Last-Write-Wins (LWW) delta updates locally...');
                await importSyncData(decrypted);
                addLog('Client: Local database tables updated & re-indexed.', 'success');

                addLog('Client: Packaging local tables for Host upload...');
                const state = useStore.getState();
                const clientPayload: SyncPayload = {
                  tasks: state.tasks,
                  notes: state.notes,
                  expenses: state.expenses,
                  budgets: state.budgets,
                  accounts: state.accounts,
                  friends: state.friends,
                  groups: state.groups,
                  sharedExpenses: state.sharedExpenses,
                  focusSessions: state.focusSessions,
                  tombstones: await db.syncTombstones.toArray(),
                };

                addLog('Client: Encrypting client database payload...');
                const encrypted = await encryptPayload(clientPayload, cryptoKey);
                addLog('Client: Uploading encrypted payload to Host...');
                channel.send(JSON.stringify(encrypted));
                addLog('Client: Sync completed successfully!', 'success');
                setStatus('completed');
                cleanup();
              } else {
                // Host receives B's data, merges it, and completes
                addLog('Host: Applying remote delta database updates...');
                await importSyncData(decrypted);
                addLog('Host: Local database tables updated.', 'success');
                addLog('Host: Sync completed successfully!', 'success');
                setStatus('completed');
                cleanup();
              }
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            addLog(`Decryption or Sync merge failed: ${message}`, 'err');
            setStatus('error');
            setErrorMessage(message);
          }
        };

        channel.onclose = () => {
          addLog('P2P data channel closed.');
        };
      };

      if (isHost) {
        addLog('Host: Opening local RTCDataChannel...');
        const channel = pc.createDataChannel('sync-channel');
        handleChannel(channel);
      } else {
        pc.ondatachannel = (event) => {
          addLog('Client: Remote data channel incoming...');
          handleChannel(event.channel);
        };
      }

      if (isHost) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.onopen = () => {
          addLog('Connected to signaling relay.');
          ws.send(JSON.stringify({ type: 'join-room', room: roomId }));
          ws.send(
            JSON.stringify({
              type: 'publish',
              room: roomId,
              sender: 'host',
              sdp: offer,
            }),
          );
          addLog('Host: Broadcasted secure SDP offer.');
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addLog(`Setup failed: ${message}`, 'err');
      setStatus('error');
      setErrorMessage(message);
    }
  };

  // Client PIN input auto-shifting
  const handlePinChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const nextInput = [...pinInput];
    nextInput[index] = digit;
    setPinInput(nextInput);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const compiled = nextInput.join('');
    if (compiled.length === 6) {
      void startClient(compiled);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/5 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-6 md:p-8 space-y-6">
        {/* Glow decoration */}
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-glow">
              <RefreshCw className={cn('h-5 w-5', status === 'syncing' && 'animate-spin')} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Zero-Knowledge Sync
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Direct Device-to-Device Pairing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/5 p-2 text-slate-500 hover:text-white border border-white/5 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Box */}
        {mode === 'select' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Instantly synchronize all your tasks, notes, accounts, budgets, and splits directly
              between adjacent devices. All payloads are encrypted using an AES-256-GCM key derived
              locally from a 6-digit pairing PIN.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => {
                  void startHost();
                }}
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-blue-500/30 transition-all text-center group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-glow group-hover:scale-105 transition-transform">
                  <Laptop className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="block text-sm font-black text-white uppercase tracking-wider">
                    Share Data
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold leading-normal">
                    Generate pairing code & host connection
                  </span>
                </div>
              </button>

              <button
                onClick={() => setMode('client')}
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-emerald-500/30 transition-all text-center group"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-glow group-hover:scale-105 transition-transform">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="block text-sm font-black text-white uppercase tracking-wider">
                    Connect to Device
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold leading-normal">
                    Enter pairing PIN to trigger database sync
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mt-4">
              <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider leading-relaxed">
                Peer-to-peer sync does not upload data to Yjs servers. Signaling is blind, and
                everything is encrypted in-browser before leaving your device.
              </span>
            </div>
          </div>
        )}

        {/* Host View */}
        {mode === 'host' && status !== 'completed' && status !== 'error' && (
          <div className="space-y-6 flex flex-col items-center">
            <div className="space-y-2 text-center w-full">
              <p className="text-xs text-slate-400 font-semibold">
                Scan the QR code or enter this 6-digit PIN on the pairing device to sync:
              </p>
              <div className="flex justify-center gap-2 py-4">
                {pin.split('').map((char, i) => (
                  <span
                    key={i}
                    className="flex h-12 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl font-black text-white shadow-glow-blue"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-4 rounded-3xl bg-white border border-white/5 shadow-2xl transition-transform hover:scale-102">
              <QRCodeSVG value={`titan:sync:${pin}`} size={160} level="M" />
            </div>

            <div className="w-full flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                Awaiting connection from pairing client...
              </span>
            </div>
          </div>
        )}

        {/* Client View */}
        {mode === 'client' && status === 'idle' && (
          <div className="space-y-4 flex flex-col items-center">
            <p className="text-xs text-slate-400 font-semibold text-center leading-relaxed">
              Enter the 6-digit pairing PIN generated on the host device:
            </p>

            <div className="flex gap-2 justify-center py-4">
              {pinInput.map((val, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-12 w-10 text-center rounded-xl border border-white/5 bg-white/5 text-xl font-black text-white focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode('select')}
              className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-white/5"
            >
              Back to Selection
            </Button>
          </div>
        )}

        {/* Connecting/Syncing Logs Panel */}
        {status !== 'idle' && status !== 'completed' && status !== 'error' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5" />
                <span>Handshake Logs</span>
              </div>
              <span className="text-blue-400 animate-pulse">Active Link</span>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/40 p-4 font-mono text-[9px] text-slate-300 space-y-2 h-40 overflow-y-auto leading-normal">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-600 shrink-0 font-bold">&gt;&gt;</span>
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success View */}
        {status === 'completed' && (
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-glow-emerald animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-white uppercase tracking-wider">
                Sync Successful
              </h4>
              <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">
                All database records have been securely merged using LWW CRDT rules. Database
                re-indexed.
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="default"
              className="shadow-glow-emerald bg-emerald-600 hover:bg-emerald-700 mt-2 px-8"
            >
              Done
            </Button>
          </div>
        )}

        {/* Error View */}
        {status === 'error' && (
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/10 shadow-glow-red">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-white uppercase tracking-wider">
                Sync Failed
              </h4>
              <p className="text-xs text-red-400/80 font-bold max-w-xs leading-relaxed">
                {errorMessage || 'Handshake failed or remote client disconnected.'}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                onClick={() => {
                  setMode('select');
                  setStatus('idle');
                  setLogs([]);
                  setErrorMessage('');
                }}
                variant="outline"
                className="border-white/5"
              >
                Retry
              </Button>
              <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-white">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
