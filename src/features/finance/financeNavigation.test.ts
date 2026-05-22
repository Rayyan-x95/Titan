import { describe, expect, it } from 'vitest';
import { getFinanceItemTarget } from './financeNavigation';

describe('finance navigation', () => {
  it('routes shared transaction rows to the existing split page', () => {
    expect(getFinanceItemTarget({ id: 'shared-1', shared: true })).toBe('/split');
  });

  it('keeps personal transaction rows in edit mode', () => {
    expect(getFinanceItemTarget({ id: 'expense-1' })).toBeUndefined();
  });
});
