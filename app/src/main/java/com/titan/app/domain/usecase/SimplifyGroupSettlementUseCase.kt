package com.titan.app.domain.usecase

import javax.inject.Inject

data class OptimizedPayment(
    val from: String,
    val to: String,
    val amount: Double
)

/**
 * Use case for simplifying group settlements tasks (Debt Simplification Algorithm).
 * Minimizes the number of transactions required to settle all debts.
 */
class SimplifyGroupSettlementUseCase @Inject constructor() {
    
    operator fun invoke(balances: List<GroupMemberBalance>): List<OptimizedPayment> {
        val debtors = balances.filter { it.netBalance < -0.01 }
            .map { it.personId to kotlin.math.abs(it.netBalance) }
            .toMutableList()
            
        val creditors = balances.filter { it.netBalance > 0.01 }
            .map { it.personId to it.netBalance }
            .toMutableList()

        val payments = mutableListOf<OptimizedPayment>()
        
        var dIndex = 0
        var cIndex = 0
        
        while (dIndex < debtors.size && cIndex < creditors.size) {
            val debtor = debtors[dIndex]
            val creditor = creditors[cIndex]
            
            val amount = kotlin.math.min(debtor.second, creditor.second)
            payments.add(OptimizedPayment(debtor.first, creditor.first, amount))
            
            debtors[dIndex] = debtor.first to (debtor.second - amount)
            creditors[cIndex] = creditor.first to (creditor.second - amount)
            
            if (debtors[dIndex].second < 0.01) dIndex++
            if (creditors[cIndex].second < 0.01) cIndex++
        }
        
        return payments
    }
}
