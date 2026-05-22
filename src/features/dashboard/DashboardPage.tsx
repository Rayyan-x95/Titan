import { useNavigate } from 'react-router-dom';
import {
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Landmark,
  TrendingDown,
  ChevronRight,
  NotebookPen,
} from 'lucide-react';
import { PageShell } from '@/components';
import { formatMoney } from '@/core/settings';
import { cn } from '@/utils/cn';
import { DashboardCard } from './components/DashboardCard';
import { QuickActions } from './components/QuickActions';
import { QuickCapture } from './components/QuickCapture';
import { SnapshotCard } from './components/SnapshotCard';
import { InsightCard } from './components/InsightCard';
import { TaskRow, NoteRow } from './components/DashboardRow';
import { ContinueCard } from './components/ContinueCard';
import { useDashboard } from './hooks/useDashboard';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    dashboardTasks,
    continueItem,
    todayString,
    formattedSpend,
    totalOwed,
    budgetSummary,
    completedTodayCount,
    pendingCount,
    priorityTasks,
    recentNotes,
    notesTotal,
    currency,
  } = useDashboard();

  return (
    <PageShell title="" description="">
      <SnapshotCard />

      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          {todayString}
        </span>
        <button
          onClick={() => {
            void navigate('/timeline');
          }}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Story
        </button>
      </div>

      <section aria-label="Quick capture">
        <QuickCapture />
      </section>

      <section aria-label="Today's insights">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <InsightCard
            label="Done"
            value={completedTodayCount}
            icon={CheckCircle2}
            accent="bg-emerald-500/30"
          />
          <InsightCard label="Pending" value={pendingCount} icon={Clock} accent="bg-blue-500/30" />
          <InsightCard
            label="Spent"
            value={formattedSpend}
            icon={TrendingDown}
            accent="bg-red-500/30"
            progress={budgetSummary.limit > 0 ? budgetSummary.percent : undefined}
          />
        </div>
      </section>

      {totalOwed !== 0 && (
        <section aria-label="Shared balances">
          <button
            onClick={() => {
              void navigate('/split');
            }}
            className="group w-full text-left focus:outline-none"
          >
            <div className="glass-panel relative overflow-hidden p-6 transition-all group-hover:shadow-glow-blue group-focus-visible:ring-2 group-focus-visible:ring-blue-500/50">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/10 transition-colors group-hover:border-blue-500/30">
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {totalOwed < 0 ? 'Settlement' : 'Shared Balance'}
                    </p>
                    <p
                      className={cn(
                        'titan-metric mt-1',
                        totalOwed > 0 ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {totalOwed < 0
                        ? formatMoney(Math.abs(totalOwed), currency)
                        : formatMoney(totalOwed, currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
                    {totalOwed > 0 ? 'Receive' : 'Pay'}
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-blue-400" />
                </div>
              </div>
            </div>
          </button>
        </section>
      )}

      {priorityTasks.length > 0 && (
        <DashboardCard
          title="Priority Focus"
          subtitle="Top urgent tasks"
          icon={<Zap className="h-5 w-5 text-amber-400" />}
        >
          <div className="space-y-1">
            {priorityTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onClick={() => {
                  void navigate('/tasks');
                }}
              />
            ))}
          </div>
        </DashboardCard>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <DashboardCard
          title="Tasks"
          subtitle={`${dashboardTasks.length} active`}
          action={
            <button
              type="button"
              id="dashboard-view-all-tasks"
              onClick={() => {
                void navigate('/tasks');
              }}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400"
            >
              All <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>
          }
        >
          {dashboardTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/5 text-slate-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-slate-500">No tasks for today</p>
              <button
                type="button"
                id="dashboard-add-first-task"
                onClick={() => {
                  void navigate('/tasks');
                }}
                className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-6 py-2.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {dashboardTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onClick={() => {
                    void navigate('/tasks');
                  }}
                />
              ))}
            </div>
          )}
        </DashboardCard>

        {continueItem && (
          <div className="flex flex-col gap-6">
            <ContinueCard item={continueItem} />

            <div className="glass-panel relative overflow-hidden p-6 transition-all hover:shadow-glow-blue">
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <Landmark className="h-4 w-4 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Spent
                  </span>
                </div>
                <p className="titan-metric mt-3 text-white">{formattedSpend}</p>
                <button
                  type="button"
                  id="dashboard-view-finance"
                  onClick={() => {
                    void navigate('/finance');
                  }}
                  className="group mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400"
                >
                  Finance{' '}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DashboardCard
        title="Recent Notes"
        subtitle={`${notesTotal} total`}
        action={
          <button
            type="button"
            id="dashboard-view-all-notes"
            onClick={() => {
              void navigate('/notes');
            }}
            className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400"
          >
            All <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </button>
        }
      >
        {recentNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/5 text-slate-600">
              <NotebookPen className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-slate-500">No notes yet</p>
            <button
              type="button"
              id="dashboard-add-first-note"
              onClick={() => {
                void navigate('/notes');
              }}
              className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-6 py-2.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20"
            >
              Create Note
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {recentNotes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onClick={() => {
                  void navigate('/notes');
                }}
              />
            ))}
          </div>
        )}
      </DashboardCard>

      <section aria-label="Quick actions">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Quick Actions
          </p>
        </div>
        <QuickActions />
      </section>
    </PageShell>
  );
}
