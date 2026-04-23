import { useMemo, useState } from 'react';
import { Plus, Users, ArrowUpRight, ArrowDownRight, Search, Landmark, ChevronRight, UserPlus, Info } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { cn } from '@/utils/cn';
import { useSeo } from '@/seo';
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

  const { groups, friends, sharedExpenses, onboarding } = useStore();
  const { currency } = useSettings();

  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalOwed = useMemo(() => calculateTotalOwed(sharedExpenses), [sharedExpenses]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    return groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [groups, searchQuery]);

  const selectedGroup = useMemo(() => 
    groups.find(g => g.id === selectedGroupId), 
  [groups, selectedGroupId]);

  const content = (
    <div className={cn("space-y-8", isEmbedded ? "pt-4" : "pt-0")}>
      {/* ── Summary Cards ────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-card/40 p-8 shadow-glass backdrop-blur-xl">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Overall Balance</p>
            <h2 className={cn(
              "mt-2 text-5xl font-black tracking-tighter",
              totalOwed > 0 ? "text-emerald-400" : totalOwed < 0 ? "text-rose-400" : "text-foreground"
            )}>
              {formatMoney(Math.abs(totalOwed), currency)}
            </h2>
            <p className="mt-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {totalOwed > 0 ? 'You are owed' : totalOwed < 0 ? 'You owe' : 'All settled'}
            </p>
          </div>
        </article>

        <article className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => setIsAddGroupOpen(true)}
            variant="outline" 
            className="h-full flex-col gap-3 rounded-[2rem] border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">New Group</span>
          </Button>
          <Button 
            onClick={() => setIsAddFriendOpen(true)}
            variant="outline" 
            className="h-full flex-col gap-3 rounded-[2rem] border-dashed border-accent/30 bg-accent/5 hover:bg-accent/10 transition-all group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent group-hover:scale-110 transition-transform">
              <UserPlus className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Friend</span>
          </Button>
        </article>
      </section>

      {/* ── Group List ────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="relative flex-1 w-full sm:max-w-md group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
             <input 
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-border/50 bg-card/30 pl-11 pr-4 text-sm font-medium outline-none focus:border-primary/50 focus:bg-card/50 transition-all"
             />
           </div>
        </div>

        {filteredGroups.length === 0 ? (
          <article className="rounded-[2.5rem] border border-dashed border-border bg-card/20 p-16 text-center shadow-inner">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground">
              <Users className="h-8 w-8" />
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">No groups yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create a group to start splitting expenses.</p>
            <Button onClick={() => setIsAddGroupOpen(true)} variant="secondary" size="sm" className="mt-6 rounded-full">
              Create First Group
            </Button>
          </article>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => {
              const balances = calculateGroupBalances(group.id, sharedExpenses, [...group.memberIds, 'user']);
              const userBalance = balances.find(b => b.friendId === 'user')?.amount || 0;
              
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className="group relative flex flex-col items-start rounded-[2rem] border border-border/50 bg-card/30 p-6 text-left transition-all hover:border-primary/40 hover:bg-card/50 shadow-glass"
                >
                  <div className="flex w-full items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <Users className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  
                  <h3 className="text-lg font-bold tracking-tight mb-1">{group.name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">
                    {group.memberIds.length + 1} Members
                  </p>

                  <div className="mt-auto pt-4 border-t border-border/50 w-full flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Balance</span>
                    <span className={cn(
                      "text-sm font-black tracking-tight",
                      userBalance > 0 ? "text-emerald-400" : userBalance < 0 ? "text-rose-400" : "text-muted-foreground"
                    )}>
                      {userBalance === 0 ? 'Settled' : formatMoney(Math.abs(userBalance), currency)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AddGroupSheet 
        open={isAddGroupOpen} 
        onOpenChange={setIsAddGroupOpen} 
      />
      <AddFriendSheet 
        open={isAddFriendOpen} 
        onOpenChange={setIsAddFriendOpen} 
      />
      
      {selectedGroup && (
        <GroupDetailView 
          group={selectedGroup} 
          open={!!selectedGroupId} 
          onOpenChange={(open) => !open && setSelectedGroupId(null)} 
        />
      )}
    </div>
  );

  if (isEmbedded) return content;

  return (
    <PageShell
      title="Split"
      description="Divide costs, settle debts, and keep your friendships balanced."
    >
      {content}
    </PageShell>
  );
}
