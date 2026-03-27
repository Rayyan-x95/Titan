package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.model.Split
import com.ninety5.titan.domain.repository.SplitRepository
import javax.inject.Inject

/**
 * Use case to partially settle a split expense.
 */
class PartiallySettleSplitUseCase @Inject constructor(
    private val repository: SplitRepository
) {
    suspend operator fun invoke(split: Split, paymentAmount: Double) {
        val newSettledAmount = split.settledAmount + paymentAmount
        val updatedSplit = split.copy(
            settledAmount = newSettledAmount,
            isSettled = newSettledAmount >= split.amount,
            updatedAt = System.currentTimeMillis()
        )
        repository.addSplit(updatedSplit)
    }
}
