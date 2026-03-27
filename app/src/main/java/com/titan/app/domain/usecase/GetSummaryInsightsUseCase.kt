package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.model.Split
import com.ninety5.titan.domain.repository.SplitRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

data class SummaryInsights(
    val totalPendingAmount: Double,
    val peopleWhoOweCount: Int,
    val oldestPendingSplit: Split?
)

/**
 * Use case for generating high-level financial insights.
 */
class GetSummaryInsightsUseCase @Inject constructor(
    private val repository: SplitRepository
) {
    operator fun invoke(currentUser: String): Flow<SummaryInsights> {
        return repository.getAllSplits().map { splits ->
            val pendingSplits = splits.filter { !it.isSettled && it.paidBy == currentUser }
            
            val totalPending = pendingSplits.sumOf { 
                val perPerson = it.amount / it.participants.size
                perPerson * (it.participants.size - (if (it.participants.contains(currentUser)) 1 else 0)) - it.settledAmount
            }
            
            val peopleCount = pendingSplits.flatMap { it.participants }.distinct().filter { it != currentUser }.size
            val oldest = pendingSplits.minByOrNull { it.createdAt }

            SummaryInsights(totalPending, peopleCount, oldest)
        }
    }
}
