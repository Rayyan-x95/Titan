import { Check, X } from 'lucide-react';

const features = [
  { name: 'Unified Tasks & Money', titan: true, others: false },
  { name: 'Offline-First Storage', titan: true, others: 'Rare' },
  { name: 'Precision Finance Engine', titan: true, others: false },
  { name: '100% Privacy (Zero Tracking)', titan: true, others: false },
  { name: 'Note-to-Transaction Linking', titan: true, others: false },
  { name: 'Zero Subscription Fees', titan: true, others: false },
];

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-background/50 shadow-2xl">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border/40 bg-card/20">
            <th className="px-6 py-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Feature
            </th>
            <th className="px-6 py-6 text-center text-sm font-black uppercase tracking-wider text-primary">
              Titan
            </th>
            <th className="px-6 py-6 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Fragmented Apps
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {features.map((feature) => (
            <tr key={feature.name} className="group transition-colors hover:bg-primary/5">
              <td className="px-6 py-5 text-sm font-medium text-foreground">{feature.name}</td>
              <td className="px-6 py-5 text-center">
                <div className="flex justify-center">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              </td>
              <td className="px-6 py-5 text-center">
                <div className="flex justify-center text-muted-foreground">
                  {typeof feature.others === 'string' ? (
                    <span className="text-xs font-bold">{feature.others}</span>
                  ) : feature.others ? (
                    <Check className="h-5 w-5 opacity-50" />
                  ) : (
                    <X className="h-5 w-5 opacity-30" />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-primary/5 px-6 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          The only true Personal Life OS
        </p>
      </div>
    </div>
  );
}
