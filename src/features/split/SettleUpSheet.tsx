import { useMemo, useState } from 'react';
import { X, CheckCircle2, ArrowRight, QrCode } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { computeSettlements } from '@/lib/core/splitEngine';
import { QRScreen } from './QRScreen';

interface SettleUpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  balances: { friendId: string; amount: number }[];
  members: { id: string; name: string }[];
}

export function SettleUpSheet({
  open,
  onOpenChange,
  groupId,
  balances,
  members,
}: SettleUpSheetProps) {
  const addSharedExpense = useStore((s) => s.addSharedExpense);
  const friends = useStore((s) => s.friends);
  const onboarding = useStore((s) => s.onboarding);
  const groups = useStore((s) => s.groups);
  const { currency } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [qrSettlement, setQrSettlement] = useState<{
    upiId: string;
    payeeName: string;
    amount: number;
    from: string;
    to: string;
    note: string;
  } | null>(null);

  const groupName = useMemo(
    () => groups.find((g) => g.id === groupId)?.name || 'Group',
    [groups, groupId],
  );
  const settlements = useMemo(() => {
    const balanceEntries = balances.map((b) => ({ id: b.friendId, balance: b.amount }));
    return computeSettlements(balanceEntries);
  }, [balances]);

  if (!open) return null;

  const handleSettle = async (from: string, to: string, amount: number) => {
    setIsSaving(true);
    try {
      const fromName = members.find((m) => m.id === from)?.name || 'Someone';
      const toName = members.find((m) => m.id === to)?.name || 'Someone';
      await addSharedExpense({
        description: `Settlement: ${fromName} paid ${toName}`,
        totalAmount: amount,
        paidBy: from,
        groupId: groupId,
        participants: [{ id: to, amount }],
        note: 'Group balance settlement',
        isSettlement: true,
        settlementStatus: 'settled',
        settlementAmount: amount,
        settlementDate: new Date().toISOString(),
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 px-4 py-4 backdrop-blur-md sm:items-center">
      <button
        type="button"
        aria-label="Close settle up sheet"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 flex flex-col w-full max-w-md max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Settle Up
            </p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight">Suggested Payments</h3>
          </div>
          <button
            type="button"
            aria-label="Close settle up sheet"
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <p className="text-sm font-bold">Everyone is settled up!</p>
            </div>
          ) : (
            settlements.map((s, i) => {
              const fromName = members.find((m) => m.id === s.from)?.name || 'Unknown';
              const toName = members.find((m) => m.id === s.to)?.name || 'Unknown';
              const receiverUpiId =
                s.to === 'user' ? onboarding.upiId : friends.find((f) => f.id === s.to)?.upiId;
              return (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-border/50 bg-secondary/10 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        From
                      </p>
                      <p className="text-sm font-black">{fromName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        To
                      </p>
                      <p className="text-sm font-black">{toName}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50 gap-4">
                    <p className="text-lg font-black tracking-tight shrink-0">
                      {formatMoney(s.amount, currency)}
                    </p>
                    <div className="flex items-center gap-2">
                      {receiverUpiId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setQrSettlement({
                              upiId: receiverUpiId,
                              payeeName: toName,
                              amount: s.amount,
                              from: s.from,
                              to: s.to,
                              note: `Split Settlement - ${groupName}`,
                            })
                          }
                          disabled={isSaving}
                          className="rounded-full px-4 border-primary/20 hover:bg-primary/5 text-primary"
                          title="Pay via QR"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Pay via QR
                        </Button>
                      ) : (
                        <div
                          className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mr-2"
                          title="Add UPI ID to this friend to enable QR payments"
                        >
                          <QrCode className="h-3.5 w-3.5 mr-1.5 opacity-50" />
                          No UPI ID
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => {
                          void handleSettle(s.from, s.to, s.amount);
                        }}
                        disabled={isSaving}
                        className="rounded-full px-5"
                      >
                        Record
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-border/50 bg-secondary/10 px-8 py-6">
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
      {qrSettlement && (
        <QRScreen
          onBack={() => setQrSettlement(null)}
          upiId={qrSettlement.upiId}
          payeeName={qrSettlement.payeeName}
          amount={qrSettlement.amount}
          note={qrSettlement.note}
          onSettled={() => {
            void (async () => {
              await handleSettle(qrSettlement.from, qrSettlement.to, qrSettlement.amount);
              setQrSettlement(null);
            })();
          }}
        />
      )}
    </div>
  );
}
