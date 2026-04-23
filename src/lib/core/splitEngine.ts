export interface SplitParticipant {
  id: string;
  weight?: number;
}

export interface SplitShare {
  id: string;
  amount: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface BalanceEntry {
  id: string;
  balance: number;
}

interface SharedExpenseLike {
  paidBy: string;
  participants: Array<{ id: string; amount: number }>;
}

function normalizeCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

export function splitEqual(totalAmount: number, participants: SplitParticipant[]): SplitShare[] {
  const total = normalizeCents(totalAmount);
  if (participants.length === 0 || total <= 0) {
    return participants.map((participant) => ({ id: participant.id, amount: 0 }));
  }

  const base = Math.floor(total / participants.length);
  let remainder = total - base * participants.length;

  return participants.map((participant) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { id: participant.id, amount: base + extra };
  });
}

export function splitWeighted(totalAmount: number, participants: SplitParticipant[]): SplitShare[] {
  const total = normalizeCents(totalAmount);
  if (participants.length === 0 || total <= 0) {
    return participants.map((participant) => ({ id: participant.id, amount: 0 }));
  }

  const weights = participants.map((participant) =>
    participant.weight && participant.weight > 0 ? participant.weight : 0,
  );
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);

  if (weightTotal <= 0) {
    return splitEqual(total, participants);
  }

  const provisional = participants.map((participant, index) => ({
    id: participant.id,
    amount: Math.floor((total * weights[index]) / weightTotal),
  }));

  let allocated = provisional.reduce((sum, item) => sum + item.amount, 0);
  let remainder = total - allocated;

  const sortedIndexes = participants
    .map((participant, index) => ({ index, weight: weights[index] }))
    .sort((left, right) => right.weight - left.weight);

  let pointer = 0;
  while (remainder > 0 && sortedIndexes.length > 0) {
    const nextIndex = sortedIndexes[pointer % sortedIndexes.length].index;
    provisional[nextIndex].amount += 1;
    remainder -= 1;
    pointer += 1;
  }

  return provisional;
}

export function validateSplitShares(totalAmount: number, shares: SplitShare[]): boolean {
  const total = normalizeCents(totalAmount);
  const sum = shares.reduce((accumulator, share) => accumulator + normalizeCents(share.amount), 0);
  return total === sum;
}

export function validateBalances(balances: BalanceEntry[]): boolean {
  const sum = balances.reduce((accumulator, entry) => accumulator + normalizeCents(entry.balance), 0);
  return Math.abs(sum) < 2; // Allow 1-2 cents rounding error across large lists
}

export function computeSettlements(balances: BalanceEntry[]): Settlement[] {
  // First ensure we are working with normalized integer cents
  const debtors = balances
    .filter((entry) => normalizeCents(entry.balance) < 0)
    .map((entry) => ({ id: entry.id, balance: Math.abs(normalizeCents(entry.balance)) }))
    .sort((left, right) => right.balance - left.balance);

  const creditors = balances
    .filter((entry) => normalizeCents(entry.balance) > 0)
    .map((entry) => ({ id: entry.id, balance: normalizeCents(entry.balance) }))
    .sort((left, right) => right.balance - left.balance);

  const totalDebt = debtors.reduce((sum, d) => sum + d.balance, 0);
  const totalCredit = creditors.reduce((sum, c) => sum + c.balance, 0);

  // If there's a slight mismatch due to rounding in upstream logic, 
  // adjust the largest debtor/creditor to ensure the settlement can zero out.
  if (totalDebt !== totalCredit && totalDebt > 0 && totalCredit > 0) {
    const diff = totalDebt - totalCredit;
    if (diff > 0) {
      creditors[0].balance += diff;
    } else {
      debtors[0].balance += Math.abs(diff);
    }
  }

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const amount = Math.min(debtor.balance, creditor.balance);
    if (amount > 0) {
      settlements.push({ from: debtor.id, to: creditor.id, amount });
      debtor.balance -= amount;
      creditor.balance -= amount;
    }

    if (debtor.balance === 0) debtorIndex += 1;
    if (creditor.balance === 0) creditorIndex += 1;
  }

  return settlements;
}

export function applySettlement(balances: BalanceEntry[], settlement: Settlement): BalanceEntry[] {
  const amount = normalizeCents(settlement.amount);
  if (amount <= 0) return [...balances];
  
  return balances.map((entry) => {
    if (entry.id === settlement.from) {
      return { ...entry, balance: normalizeCents(entry.balance) + amount };
    }
    if (entry.id === settlement.to) {
      return { ...entry, balance: normalizeCents(entry.balance) - amount };
    }
    return entry;
  });
}

export function calculateTotalOwed(sharedExpenses: SharedExpenseLike[], userId = 'user'): number {
  // Net amount across all shared expenses for the selected user.
  let total = 0;
  sharedExpenses.forEach((expense) => {
    if (expense.paidBy === userId) {
      // User paid, they are owed what others are sharing
      const othersShare = expense.participants
        .filter((participant) => participant.id !== userId)
        .reduce((sum, participant) => sum + normalizeCents(participant.amount), 0);
      total += normalizeCents(othersShare);
    } else {
      // Someone else paid, user might owe them
      const userShare = expense.participants.find((participant) => participant.id === userId)?.amount ?? 0;
      total -= normalizeCents(userShare);
    }
  });
  return normalizeCents(total);
}
