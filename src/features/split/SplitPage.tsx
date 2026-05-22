import { useMemo, useState } from 'react';
import { Users, Search, ChevronRight, UserPlus } from 'lucide-react';
import { PageShell } from '@/components';
import { Button } from '@/components/ui';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { cn } from '@/utils/cn';
import { useSeo } from '@/hooks/useSeo';
import { calculateGroupBalances } from './splitLogic';
import { calculateTotalOwed } from '@/lib/core/splitEngine';
import { AddGroupSheet } from './AddGroupSheet';
import { AddFriendSheet } from './AddFriendSheet';
import { GroupDetailView } from './GroupDetailView';

interface SplitPageProps {
  isEmbedded?: boolean;
}

export function SplitPage({ isEmbedded = false }: SplitPageProps) {
  useSeo({
    title: 'Split',
    description: 'Track group expenses and shared balances with friends.',
    path: '/split',
  });

  const groups = useStore((s) => s.groups);
  const sharedExpenses = useStore((s) => s.sharedExpenses);
  const { currency } = useSettings();

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalOwed = useMemo(() => calculateTotalOwed(sharedExpenses), [sharedExpenses]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [groups, searchQuery]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId],
  );

  const content = (
    <div className={cn('space-y-8', isEmbedded ? 'pt-4' : 'pt-0')}>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="glass-panel relative overflow-hidden rounded-[2.5rem] p-10 shadow-glow border-white/10 group">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px] transition-all duration-700 group-hover:bg-blue-500/20" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">
              Overall Balance
            </p>
            <h2
              className={cn(
                'titan-metric text-6xl tracking-tighter transition-all duration-300',
                totalOwed > 0 ? 'text-emerald-400' : totalOwed < 0 ? 'text-rose-400' : 'text-white',
              )}
            >
              {formatMoney(Math.abs(totalOwed), currency)}
            </h2>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {totalOwed > 0 ? 'You are owed' : totalOwed < 0 ? 'You owe' : 'All settled up'}
            </p>
          </div>
        </article>

        <article className="grid grid-cols-2 gap-6">
          <Button
            onClick={() => setIsAddGroupOpen(true)}
            variant="glass"
            className="h-full flex-col gap-4 rounded-[2.5rem] border-white/5 py-8 transition-all group"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-glow group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              New Group
            </span>
          </Button>
          <Button
            onClick={() => setIsAddFriendOpen(true)}
            variant="glass"
            className="h-full flex-col gap-4 rounded-[2.5rem] border-white/5 py-8 transition-all group"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/10 shadow-glow group-hover:scale-110 transition-transform">
              <UserPlus className="h-7 w-7" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              Add Friend
            </span>
          </Button>
        </article>
      </section>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 w-full rounded-[1.25rem] border border-white/5 bg-white/5 pl-12 pr-4 text-sm font-bold text-white outline-none focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <article className="rounded-[2.5rem] border border-dashed border-border bg-card/20 p-16 text-center shadow-inner">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground">
              <Users className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">No groups yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a group to start splitting expenses.
            </p>
            <Button
              onClick={() => setIsAddGroupOpen(true)}
              variant="secondary"
              size="sm"
              className="mt-6 rounded-full"
            >
              Create First Group
            </Button>
          </article>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => {
              const balances = calculateGroupBalances(group.id, sharedExpenses, [
                ...group.memberIds,
                'user',
              ]);
              const userBalance = balances.find((b) => b.friendId === 'user')?.amount || 0;
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className="glass-panel group relative flex flex-col items-start rounded-[2.5rem] p-8 text-left transition-all duration-300 hover:bg-white/5 hover:scale-[1.02] border-white/5 shadow-glow"
                >
                  <div className="flex w-full items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-glow group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-white mb-1">
                    {group.name}
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">
                    {group.memberIds.length + 1} Members
                  </p>
                  <div className="mt-auto pt-6 border-t border-white/5 w-full flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                      Your Balance
                    </span>
                    <span
                      className={cn(
                        'text-base font-black tracking-tight',
                        userBalance > 0
                          ? 'text-emerald-400 shadow-glow-emerald'
                          : userBalance < 0
                            ? 'text-rose-400 shadow-glow-rose'
                            : 'text-slate-500',
                      )}
                    >
                      {userBalance === 0 ? 'SETTLED' : formatMoney(Math.abs(userBalance), currency)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <>
      <PageShell
        eyebrow="Shared"
        title="Splits & Groups"
        description="Balance-first view for friends, groups, and fast settlement actions."
      >
        {content}
      </PageShell>

      <AddGroupSheet open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen} />
      <AddFriendSheet open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen} />
      {selectedGroup && (
        <GroupDetailView
          group={selectedGroup}
          open={!!selectedGroupId}
          onOpenChange={(open) => !open && setSelectedGroupId(null)}
        />
      )}
    </>
  );
}
