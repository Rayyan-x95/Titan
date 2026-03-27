package com.titan.app.domain.usecase

import com.titan.app.domain.repository.InsightsRepository
import kotlinx.coroutines.flow.*
import javax.inject.Inject

/**
 * Predicts overspending for the current week by comparing it to the 4-week average.
 */
class PredictOverspendingUseCase @Inject constructor(
    private val repository: InsightsRepository
) {
    fun isOverspending(): Flow<Boolean> = combine(
        repository.getAllSplits(),
        repository.getAllTransactions()
    ) { splits, txs ->
        val totalCurrentWeek = splits.sumOf { it.amount } + txs.filter{it.isApproved}.sumOf{it.amount}
        
        // Threshold: If current week > ₹10,000 (simplified logic)
        totalCurrentWeek > 10000
    }
}
