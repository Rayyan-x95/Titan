import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Plus, List, CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui';
import { PageShell } from '@/components';
import { useStore } from '@/core/store';
import type { Task, TaskStatus } from '@/core/store/types';
import { useSeo } from '@/hooks/useSeo';
import { TaskForm } from '../components/TaskForm';
import { TaskItem } from '../components/TaskItem';
import { TaskCalendar } from '../components/TaskCalendar';
import { TaskKanban } from '../components/TaskKanban';
import { FocusTimerSheet } from '../components/FocusTimerSheet';
import { cn } from '@/utils/cn';
import { useTaskTree } from '../hooks/useTaskTree';

type TaskFilter = 'all' | 'active' | 'completed';
type TaskView = 'list' | 'calendar' | 'kanban';

export function TasksPage() {
  useSeo({
    title: 'Tasks',
    description:
      'Master your productivity with smart task management. Organize workflows, set priorities, and connect tasks to your notes and finances.',
    path: '/tasks',
  });

  const tasks = useStore((state) => state.tasks);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const hydrated = useStore((state) => state.hydrated);
  const processRecurringTasks = useStore((state) => state.processRecurringTasks);

  useEffect(() => {
    if (hydrated) {
      void processRecurringTasks();
    }
  }, [hydrated, processRecurringTasks]);

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<TaskView>('list');
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [isFocusOpen, setIsFocusOpen] = useState(false);

  const handleFocusTask = (task: Task) => {
    setFocusTask(task);
    setIsFocusOpen(true);
  };

  const markedDates = useMemo(
    () => tasks.map((t) => t.dueDate).filter(Boolean) as string[],
    [tasks],
  );

  const taskTree = useTaskTree({ tasks, filter, selectedDate });

  const handleCreateTask = async (values: import('@/core/store/types').TaskInput) => {
    try {
      await addTask({ ...values, title: values.title.trim() });
      setIsFormOpen(false);
    } catch (err) {
      // Error handled by UI feedback
      // For now using alert as fallback, ideally should use a toast component
      alert(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const handleUpdateTask = async (values: import('@/core/store/types').TaskInput) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, { ...values, title: values.title.trim() });
      setEditingTask(null);
    } catch (err) {
      // Error handled by UI feedback
      alert(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo';
    try {
      await updateTask(task.id, { status: nextStatus });
    } catch (err) {
      // Error handled by UI feedback
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask(task.id);
    } catch (err) {
      // Error handled by UI feedback
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };
  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };
  const handleAddSubtask = (parentId: string) => {
    setEditingTask({ parentTaskId: parentId } as Task);
    setIsFormOpen(true);
  };

  return (
    <PageShell
      eyebrow="Execution"
      title="Tasks"
      description="Plan today, keep upcoming visible, and close loops without clutter."
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full lg:w-auto shrink-0 space-y-4">
          <div className="flex lg:hidden items-center justify-between px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                : 'Calendar'}
            </p>
            <button
              onClick={() => setShowMobileCalendar(!showMobileCalendar)}
              className="text-[10px] font-black uppercase tracking-widest text-blue-400 py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20"
            >
              {showMobileCalendar ? 'Hide' : 'Show'}
            </button>
          </div>

          <div
            className={cn(
              'transition-all duration-500 ease-in-out overflow-hidden',
              showMobileCalendar
                ? 'max-h-[500px] opacity-100'
                : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100',
            )}
          >
            <Calendar
              value={selectedDate ?? undefined}
              markedDates={markedDates}
              onChange={(date) => {
                setSelectedDate(date);
                if (window.innerWidth < 1024) setShowMobileCalendar(false);
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex w-full sm:w-auto items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 select-none">
              {(['all', 'active', 'completed'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={cn(
                    'whitespace-nowrap px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex-shrink-0',
                    filter === item
                      ? 'bg-blue-600 text-white shadow-glow-blue border border-blue-500/50 scale-105 active:scale-95'
                      : 'glass-panel text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/5 active:scale-95',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex rounded-full glass-panel p-1 border-white/5">
                <button
                  onClick={() => setView('list')}
                  aria-label="List view"
                  className={cn(
                    'p-2 rounded-xl transition-all duration-300',
                    view === 'list'
                      ? 'bg-white/10 text-blue-400 shadow-glow'
                      : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  <List className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setView('calendar')}
                  aria-label="Calendar view"
                  className={cn(
                    'p-2 rounded-xl transition-all duration-300',
                    view === 'calendar'
                      ? 'bg-white/10 text-blue-400 shadow-glow'
                      : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  <CalendarDays className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setView('kanban')}
                  aria-label="Kanban view"
                  className={cn(
                    'p-2 rounded-xl transition-all duration-300',
                    view === 'kanban'
                      ? 'bg-white/10 text-blue-400 shadow-glow'
                      : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M8 7v7" />
                    <path d="M12 7v4" />
                    <path d="M16 7v9" />
                  </svg>
                </button>
              </div>
              <button
                onClick={openCreateForm}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 sm:py-2.5 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold text-sm shadow-glow-blue active:scale-95 transition-all"
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
                <span>New</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={view + filter + (selectedDate?.toISOString() || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'calendar' ? (
                <TaskCalendar
                  onDateClick={(d) => {
                    setSelectedDate(d);
                    setView('list');
                  }}
                  onEditTask={openEditForm}
                />
              ) : view === 'kanban' ? (
                <TaskKanban tasks={taskTree.topLevel} onEditTask={openEditForm} />
              ) : (
                <LayoutGroup>
                  <div className="space-y-4">
                    {taskTree.topLevel.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        subtasks={taskTree.childrenMap.get(task.id)}
                        onEdit={openEditForm}
                        onToggleStatus={(t) => {
                          void handleToggleStatus(t);
                        }}
                        onDelete={(t) => {
                          void handleDeleteTask(t);
                        }}
                        onAddSubtask={handleAddSubtask}
                        onFocus={handleFocusTask}
                      />
                    ))}
                    {taskTree.topLevel.length === 0 && (
                      <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                          <img
                            src="/icons/falcon.png"
                            alt="Falcon"
                            className="relative h-32 w-32 opacity-20 grayscale hover:opacity-40 transition-opacity duration-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-black text-white tracking-tighter">
                            A Clean Horizon
                          </p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                            Adjust filters or start a new quest.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </LayoutGroup>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <TaskForm
        open={isFormOpen}
        title={editingTask ? 'Edit task' : 'New task'}
        submitLabel={editingTask ? 'Save' : 'Create'}
        initialValues={editingTask ?? undefined}
        onOpenChange={setIsFormOpen}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />

      <FocusTimerSheet open={isFocusOpen} onOpenChange={setIsFocusOpen} task={focusTask} />
    </PageShell>
  );
}
