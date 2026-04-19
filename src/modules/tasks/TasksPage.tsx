import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/PageShell';
import { useStore } from '@/core/store';
import type { Task, TaskStatus } from '@/core/store/types';
import { TaskForm } from './TaskForm';
import { TaskItem } from './TaskItem';

type TaskFilter = 'all' | 'active' | 'completed';

export function TasksPage() {
  const tasks = useStore((state) => state.tasks);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const hydrated = useStore((state) => state.hydrated);

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
  }, [hydrated]);

  const visibleTasks = useMemo(() => {
    const sortedTasks = [...tasks].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    if (filter === 'active') {
      return sortedTasks.filter((task) => task.status !== 'done');
    }

    if (filter === 'completed') {
      return sortedTasks.filter((task) => task.status === 'done');
    }

    return sortedTasks;
  }, [filter, tasks]);

  const handleCreateTask = async (values: {
    title: string;
    dueDate?: string;
    status: TaskStatus;
  }) => {
    await addTask({
      title: values.title.trim(),
      status: values.status,
      dueDate: values.dueDate || undefined,
      noteId: undefined,
    });
    setIsFormOpen(false);
  };

  const handleUpdateTask = async (values: {
    title: string;
    dueDate?: string;
    status: TaskStatus;
  }) => {
    if (!editingTask) {
      return;
    }

    await updateTask(editingTask.id, {
      title: values.title.trim(),
      status: values.status,
      dueDate: values.dueDate || undefined,
    });
    setEditingTask(null);
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo';

    await updateTask(task.id, { status: nextStatus });
  };

  const handleDeleteTask = async (task: Task) => {
    const confirmed = window.confirm(`Delete task “${task.title}”?`);

    if (!confirmed) {
      return;
    }

    await deleteTask(task.id);
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  return (
    <PageShell
      title="Tasks"
      description="Capture, sort, and move work forward without leaving the app shell."
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'completed'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={
                filter === item
                  ? 'rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground'
                  : 'rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground'
              }
            >
              {item === 'all' ? 'All' : item === 'active' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>

        <Button onClick={openCreateForm} className="shrink-0" aria-label="Create task">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      <section className="space-y-3">
        {visibleTasks.length === 0 ? (
          <article className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-foreground">No tasks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first task to start tracking work.
            </p>
          </article>
        ) : (
          visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onEdit={openEditForm}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </section>

      <TaskForm
        open={isFormOpen}
        title={editingTask ? 'Edit task' : 'New task'}
        submitLabel={editingTask ? 'Save changes' : 'Create task'}
        initialValues={editingTask ?? undefined}
        onOpenChange={(nextOpen) => {
          setIsFormOpen(nextOpen);
          if (!nextOpen) {
            setEditingTask(null);
          }
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />
    </PageShell>
  );
}