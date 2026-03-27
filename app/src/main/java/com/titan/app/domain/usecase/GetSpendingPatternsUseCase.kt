package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.repository.InsightsRepository
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class SpendTrend(
    val totalAmount: Double,
    val splitShare: Double,
    val cashSpent: Double,
    val timeLabel: String // Today, This Week, Month
)

/**
 * Aggregates all spends to identify trends.
 */
class GetSpendingPatternsUseCase @Inject constructor(
    private val insightsRepository: InsightsRepository
) {
    operator fun invoke(): Flow<List<SpendTrend>> = combine(
        insightsRepository.getAllSplits(),
        insightsRepository.getAllCashEntries(),
        insightsRepository.getAllTransactions()
    ) { splits, cash, txs ->
        // Simplified: Grouping only by week for now
        val totalSplits = splits.sumOf { it.amount }
        val totalCash = cash.sumOf { it.amount }
        val totalTxs = txs.filter { it.isApproved }.sumOf { it.amount }

        listOf(SpendTrend(totalSplits + totalCash + totalTxs, totalSplits, totalCash, "THIS WEEK"))
    }
}
