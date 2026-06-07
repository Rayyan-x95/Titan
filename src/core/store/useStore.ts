import { create } from 'zustand';
// No direct type usage in this file, types are imported in slices

import { createTaskSlice, type TaskSlice } from './slices/taskSlice';
import { createNoteSlice, type NoteSlice } from './slices/noteSlice';
import { createFinanceSlice, type FinanceSlice } from './slices/financeSlice';
import { createAccountSlice, type AccountSlice } from './slices/accountSlice';
import { createOnboardingSlice, type OnboardingSlice } from './slices/onboardingSlice';
import { createSplitSlice, type SplitSlice } from './slices/splitSlice';
import { createSystemSlice, type SystemSlice } from './slices/systemSlice';
import { createFocusSlice, type FocusSlice } from './slices/focusSlice';

export type CoreStoreState = TaskSlice &
  NoteSlice &
  FinanceSlice &
  AccountSlice &
  OnboardingSlice &
  SplitSlice &
  SystemSlice &
  FocusSlice;

export const useStore = create<CoreStoreState>()((...a) => ({
  ...createTaskSlice(...a),
  ...createNoteSlice(...a),
  ...createFinanceSlice(...a),
  ...createAccountSlice(...a),
  ...createOnboardingSlice(...a),
  ...createSplitSlice(...a),
  ...createSystemSlice(...a),
  ...createFocusSlice(...a),
}));
