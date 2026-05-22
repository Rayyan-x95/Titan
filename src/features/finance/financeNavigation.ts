import type { Expense } from '@/core/store/types';

type FinanceListItem = Pick<Expense, 'id'> & { shared?: boolean };

export function getFinanceItemTarget(item: FinanceListItem) {
  return item.shared ? '/split' : undefined;
}
