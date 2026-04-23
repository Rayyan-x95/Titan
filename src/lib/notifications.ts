import { format } from 'date-fns';
import { useSettings } from '@/core/settings';

/**
 * Notification types and channels
 */
type NotificationType = 'task.due' | 'task.completed' | 'budget.alert' | 'shared.expense';

/**
 * Create a notification handler using Zustand
 */
export function createNotificationHandler() {
  const canNotify = () => 'Notification' in window && Notification.permission === 'granted';

  const send = (title: string, options: NotificationOptions) => {
    if (!canNotify()) return;
    new Notification(title, options);
  };

  const notifyTaskDue = (task: { id?: string; title: string; due: string }) => {
    const { notificationSettings, notifications } = useSettings.getState();
    if (!notifications || !notificationSettings.taskDueDate) return;

    const now = new Date();
    const due = new Date(task.due);
    const hoursLeft = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hoursLeft < 1 || hoursLeft > 24) return;

    send('Task Due Soon', {
      body: `${task.title} is due in ${hoursLeft} hours`,
      icon: '/icons/titan-icon-192.png',
      badge: '/icons/titan-icon-192.png',
      tag: `task-${task.id || task.title}`,
      data: { action: 'task', view: `/tasks?filter=due=${format(new Date(task.due), 'yyyy-MM-dd')}` },
    });
  };

  const notifyTaskCompleted = (task: { id?: string; title: string }) => {
    const { notificationSettings } = useSettings.getState();
    if (!notificationSettings.taskCompleted) return;

    send('Task Completed', {
      body: `Great job! "${task.title}" is complete.`,
      icon: '/icons/titan-icon-192.png',
      badge: '/icons/titan-icon-192.png',
      tag: `task-${task.id || task.title}`,
    });
  };

  const notifyBudgetAlert = (budget: { category: string; spent: number; limit: number }) => {
    const { notificationSettings } = useSettings.getState();
    if (!notificationSettings.budgetAlert) return;

    const percent = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
    const urgency = percent > 85 ? 'Over 85%' : 'Nearly there';

    send('Budget Alert', {
      body: `${budget.category}: ${urgency} (${formatMoney(budget.spent)} / ${formatMoney(budget.limit)})`,
      icon: '/icons/titan-icon-192.png',
      badge: '/icons/titan-icon-192.png',
      tag: `budget-${budget.category}`,
      data: { action: 'budget', view: '/finance' },
    });
  };

  const notifySharedExpense = (expense: { merchant: string; amount: number }) => {
    const { notificationSettings } = useSettings.getState();
    if (!notificationSettings.sharedBalance) return;

    send('Shared Payment Detected', {
      body: `You shared ${formatMoney(expense.amount)} with ${expense.merchant}`,
      icon: '/icons/titan-icon-192.png',
      badge: '/icons/titan-icon-192.png',
      tag: `expense-${expense.merchant}`,
      data: { action: 'expense', view: '/finance?new=1' },
    });
  };

  return {
    notifyTaskDue,
    notifyTaskCompleted,
    notifyBudgetAlert,
    notifySharedExpense,

    /**
     * Schedule a notification for later
     */
    schedule: (delayMs: number, type: NotificationType, data: unknown) => {
      setTimeout(() => {
        switch (type) {
          case 'task.due':
            notifyTaskDue(data as { id?: string; title: string; due: string });
            break;
          case 'task.completed':
            notifyTaskCompleted(data as { id?: string; title: string });
            break;
          case 'budget.alert':
            notifyBudgetAlert(data as { category: string; spent: number; limit: number });
            break;
          case 'shared.expense':
            notifySharedExpense(data as { merchant: string; amount: number });
            break;
        }
      }, delayMs);
    },

    /**
     * Clear all notifications
     */
    clearAll: () => {
      // Browser Notification API does not provide a global clear API.
    },
  };
}

/**
 * Format money for notifications
 */
function formatMoney(cents: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(cents / 100);

  return formatted;
}
