import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Share2, Copy, Check, ShieldCheck, AlertCircle, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { useClipboard } from '@/hooks/useClipboard';
import { generateShareableQR } from '@/utils/qrUtils';

interface QRScreenProps {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
  onBack: () => void;
  onSettled?: () => void;
}

export function QRScreen({ upiId, payeeName, amount, note, onBack, onSettled }: QRScreenProps) {
  const [sharing, setSharing] = useState(false);
  const { copied, copy } = useClipboard();

  const upiUrl = useMemo(() => {
    const amountInRs = (amount / 100).toString();
    const cleanNote = note ? encodeURIComponent(note) : 'Titan Payment';
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amountInRs}&tn=${cleanNote}&cu=INR`;
  }, [upiId, payeeName, amount, note]);

  const handleShare = async () => {
    try {
      setSharing(true);
      const dataUrl = await generateShareableQR(upiUrl, amount, note);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'titan-payment.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Titan Payment QR',
          text: `Pay ${amount / 100} via Titan`,
        });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'titan-payment.png';
        link.click();
      }
    } catch {
      // Error handled by UI feedback
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          type="button"
          aria-label="Go back"
          title="Go back"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
            Secure Payment
          </span>
          <h2 className="text-sm font-bold">UPI QR Code</h2>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        {/* QR Container */}
        <div className="relative mb-12">
          <div className="absolute -inset-10 animate-pulse bg-blue-500/20 blur-3xl" />

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white p-8 shadow-2xl"
          >
            <div className="relative">
              <QRCodeSVG
                value={upiUrl}
                size={240}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: '/icons/falcon.png',
                  x: undefined,
                  y: undefined,
                  height: 48,
                  width: 48,
                  excavate: true,
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/40"
          >
            <ShieldCheck className="h-6 w-6 text-white" />
          </motion.div>
        </div>

        {/* Info */}
        <div className="mb-12 text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
              Requesting
            </p>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black tracking-tighter">
                ₹{(amount / 100).toLocaleString()}
              </span>
            </div>
            {payeeName && (
              <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-widest">
                Pay to: {payeeName}
              </p>
            )}
            {note && <p className="mt-4 text-sm font-medium text-slate-400 italic">“{note}”</p>}
          </motion.div>
        </div>

        {/* Actions */}
        <div className="grid w-full max-w-sm grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="lg"
            className="h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10"
            onClick={() => void copy(upiId)}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-5 w-5" />
                  <span>Copy ID</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <Button
            variant="primary"
            size="lg"
            className="h-14 rounded-2xl shadow-glow shadow-blue-500/20"
            onClick={() => void handleShare()}
            disabled={sharing}
          >
            {sharing ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span>Processing</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                <span>Share QR</span>
              </div>
            )}
          </Button>
        </div>

        {/* Guidelines */}
        <div className="mt-12 flex flex-col gap-4 w-full max-w-sm">
          {onSettled && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={onSettled}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark as Settled
            </Button>
          )}
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-6 py-4">
            <AlertCircle className="h-5 w-5 text-slate-500" />
            <p className="text-[11px] font-medium leading-relaxed text-slate-400">
              Recipient will see your name and UPI ID. Only share this code with people you trust.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex items-center justify-center gap-2 pb-10 opacity-40">
        <QrCode className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Powered by Titan</span>
      </div>
    </motion.div>
  );
}
