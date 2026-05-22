import { useStore } from '@/core/store';
import {
  Activity,
  ShieldAlert,
  Database,
  Clock,
  Terminal,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

export function DiagnosticsDashboard() {
  const metrics = useStore((s) => s.metrics);
  const logs = useStore((s) => s.logs);
  const [showLogs, setShowLogs] = useState(false);

  const exportFullReport = () => {
    const report = {
      systemMetrics: metrics,
      eventLogs: logs,
      runtime: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        online: navigator.onLine,
      },
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `titan-full-diagnostics-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-glow">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              System Diagnostics
            </h3>
            <p className="text-[11px] text-slate-500 font-bold">Local-first health monitoring</p>
          </div>
        </div>
        <button
          onClick={exportFullReport}
          className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white border border-white/5 hover:bg-white/10 transition-all hover:shadow-glow-white active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Full Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Hydration Metric */}
        <div className="rounded-[1.5rem] border border-white/5 bg-white/2 p-5 transition-all hover:bg-white/5">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Hydration Latency
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{metrics.hydrationTime}</span>
            <span className="text-xs font-black text-slate-600 uppercase">ms</span>
          </div>
        </div>

        {/* DB Status */}
        <div className="rounded-[1.5rem] border border-white/5 bg-white/2 p-5 transition-all hover:bg-white/5">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Database className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Storage Health</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                metrics.dbStatus === 'online'
                  ? 'bg-emerald-500 shadow-glow-emerald'
                  : 'bg-red-500 shadow-glow-red',
              )}
            />
            <span className="text-sm font-black text-white uppercase tracking-wider">
              {metrics.dbStatus === 'online' ? 'Optimal' : 'Issues'}
            </span>
          </div>
        </div>
      </div>

      {/* Event Logs Accordion */}
      <div className="rounded-[1.5rem] border border-white/5 bg-white/2 overflow-hidden">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex w-full items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-slate-500" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              System Event Logs ({logs.length})
            </span>
          </div>
          {showLogs ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {showLogs && (
          <div className="border-t border-white/5 px-5 py-5 space-y-3 max-h-64 overflow-y-auto font-mono text-[10px]">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic text-center py-6 text-[10px] font-bold uppercase tracking-widest">
                No recent events
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-4 group py-1 border-b border-white/[0.02] last:border-0"
                >
                  <span className="text-slate-600 shrink-0 font-bold">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span
                    className={cn(
                      'font-black uppercase shrink-0 tracking-tighter',
                      log.level === 'error'
                        ? 'text-red-500'
                        : log.level === 'warn'
                          ? 'text-amber-500'
                          : 'text-blue-400',
                    )}
                  >
                    [{log.category}]
                  </span>
                  <span className="text-slate-400 leading-tight font-medium">{log.message}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] bg-amber-500/5 border border-amber-500/10 p-5">
        <div className="flex gap-4">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-[10px] text-amber-500/70 font-bold leading-relaxed uppercase tracking-wider">
            Titan diagnostics are stored locally in your browser's RAM and IndexedDB. No data is
            transmitted to external servers. Exporting a report will create a file on your device
            that you can manually share for troubleshooting.
          </p>
        </div>
      </div>
    </div>
  );
}
