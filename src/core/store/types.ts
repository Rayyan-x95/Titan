import type { CurrencyCode } from '../settings';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type LifeArea = 'work' | 'personal' | 'health' | 'finance' | 'social';

export type MoneyCents = number;

export function fromDollars(amountDollars: number): MoneyCents {
  return Math.round(amountDollars * 100);
}

export function toDollars(amountCents: MoneyCents): number {
  return amountCents / 100;
}

export interface Friend {
  id: string;
  name: string;
  phoneNumber?: string;
  upiId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface SharedExpense {
  id: string;
  totalAmount: MoneyCents;
  description: string;
  paidBy: string;
  groupId?: string;
  participants: { id: string; amount: MoneyCents }[];
  linkedExpenseId?: string;
  note?: string;
  area?: LifeArea;
  isSettlement?: boolean;
  settlementStatus?: 'pending' | 'settled';
  settlementAmount?: MoneyCents;
  settlementDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupBalance {
  friendId: string;
  amount: MoneyCents;
}

export interface TaskRecurrence {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  energy?: EnergyLevel;
  area?: LifeArea;
  dueDate?: string;
  noteId?: string;
  parentTaskId?: string;
  recurrence?: TaskRecurrence;
  tags?: string[];
  createdAt: string;
  lastProcessedAt?: string;
  updatedAt?: string;
}

export interface Note {
  id: string;
  content: string;
  tags: string[];
  area?: LifeArea;
  linkedTaskIds?: string[];
  linkedNoteIds?: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  name: string;
  balance: MoneyCents;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  amount: MoneyCents;
  category: string;
  type: 'expense' | 'income';
  accountId: string;
  tags: string[];
  area?: LifeArea;
  note?: string;
  isRecurring: boolean;
  recurrenceRule?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  linkedTaskId?: string;
  linkedNoteId?: string;
  createdAt: string;
  lastProcessedAt?: string;
  updatedAt?: string;
}

export interface DailySnapshot {
  date: string; // ISO Date string (YYYY-MM-DD)
  tasksCompleted: number;
  expensesTotal: MoneyCents;
  notesCreated: number;
  splitsAdded: number;
  topArea: LifeArea;
}

export interface Budget {
  id: string;
  category: string;
  limit: MoneyCents;
  period: 'weekly' | 'monthly';
  updatedAt?: string;
}

export type FinancialGoal =
  | 'save-money'
  | 'track-spending'
  | 'improve-productivity'
  | 'reduce-expenses';

export interface OnboardingPreferences {
  notifications: boolean;
  darkMode: boolean;
  notificationSettings?: {
    taskDueDate: boolean;
    budgetAlert: boolean;
    taskCompleted: boolean;
    sharedBalance: boolean;
  };
}

export interface OnboardingProfile {
  id: 'primary';
  name: string;
  phoneNumber?: string;
  upiId?: string;
  currency: CurrencyCode;
  dob?: string;
  income: MoneyCents;
  avgExpense: MoneyCents;
  goals: FinancialGoal[];
  preferences: OnboardingPreferences;
  currentStep: number;
  completedAt?: string;
  skippedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'priority'> &
  Partial<Pick<Task, 'id' | 'createdAt' | 'priority'>>;

export type NoteInput = Omit<
  Note,
  'id' | 'createdAt' | 'linkedTaskIds' | 'linkedNoteIds' | 'pinned'
> &
  Partial<Pick<Note, 'id' | 'createdAt' | 'linkedTaskIds' | 'linkedNoteIds' | 'pinned'>>;

export interface AccountInput {
  id?: string;
  name: string;
  balanceDollars: number;
}

export interface ExpenseInput {
  id?: string;
  amount?: number;
  amountDollars?: number;
  category: string;
  type?: 'expense' | 'income';
  accountId?: string;
  tags?: string[];
  area?: LifeArea;
  note?: string;
  isRecurring?: boolean;
  recurrenceRule?: Expense['recurrenceRule'];
  linkedTaskId?: string;
  linkedNoteId?: string;
  createdAt?: string;
}

export interface BudgetInput {
  id?: string;
  category: string;
  limit: number; // in cents for convenience in internal logic if needed, but the user requested limit
  period: 'weekly' | 'monthly';
}

export type OnboardingUpdate = Partial<
  Pick<
    OnboardingProfile,
    | 'name'
    | 'phoneNumber'
    | 'upiId'
    | 'currency'
    | 'dob'
    | 'income'
    | 'avgExpense'
    | 'goals'
    | 'preferences'
    | 'currentStep'
  >
>;

export type FriendInput = Omit<Friend, 'id' | 'createdAt'> &
  Partial<Pick<Friend, 'id' | 'createdAt'>>;
export type GroupInput = Omit<Group, 'id' | 'createdAt'> & Partial<Pick<Group, 'id' | 'createdAt'>>;
export type SharedExpenseInput = Omit<SharedExpense, 'id' | 'createdAt'> &
  Partial<Pick<SharedExpense, 'id' | 'createdAt'>>;

export type FriendUpdate = Partial<Omit<Friend, 'id' | 'createdAt'>>;
export type GroupUpdate = Partial<Omit<Group, 'id' | 'createdAt'>>;
export type SharedExpenseUpdate = Partial<Omit<SharedExpense, 'id' | 'createdAt'>>;

export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt'>>;
export type NoteUpdate = Partial<Omit<Note, 'id' | 'createdAt'>>;
export type AccountUpdate = Partial<Omit<Account, 'id' | 'createdAt'>>;
export type ExpenseUpdate = Partial<Omit<Expense, 'id'>>;
export type BudgetUpdate = Partial<Omit<Budget, 'id'>>;

export type TimelineItem =
  | { type: 'task'; data: Task; timestamp: string }
  | { type: 'note'; data: Note; timestamp: string }
  | { type: 'expense'; data: Expense; timestamp: string }
  | { type: 'split'; data: SharedExpense; timestamp: string };

export interface FocusSession {
  id: string;
  taskId?: string;
  startTime: string;
  durationSeconds: number;
  notes?: string;
  updatedAt?: string;
}

export type FocusSessionInput = Omit<FocusSession, 'id' | 'startTime'> &
  Partial<Pick<FocusSession, 'id' | 'startTime'>>;

export type FocusSessionUpdate = Partial<Omit<FocusSession, 'id' | 'startTime'>>;

export interface Embedding {
  id: string;
  entityId: string;
  type: 'task' | 'note';
  vector: number[];
  text: string;
  updatedAt: string;
}

export interface SyncTombstone {
  id: string;
  entityId: string;
  entityType: string;
  deletedAt: string;
}
