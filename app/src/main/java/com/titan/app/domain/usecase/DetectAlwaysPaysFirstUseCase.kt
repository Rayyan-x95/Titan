package com.titan.app.domain.usecase

import com.titan.app.domain.repository.InsightsRepository
import kotlinx.coroutines.flow.*
import javax.inject.Inject

/**
 * Detects if the user is the one paying for the majority of splits.
 * Highlights imbalance in group spending.
 */
class DetectAlwaysPaysFirstUseCase @Inject constructor(
    private val repository: InsightsRepository
) {
    fun detect(): Flow<Double> = repository.getAllSplits().map { splits ->
        if (splits.isEmpty()) return@map 0.0
        
        val paidCount = splits.count { it.paidBy == "user" } // In Phase 1/2 we assumed "user" or similar
        (paidCount.toDouble() / splits.size) * 100
    }
}
