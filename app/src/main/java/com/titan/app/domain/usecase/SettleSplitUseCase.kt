package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.model.Split
import com.ninety5.titan.domain.repository.SplitRepository
import javax.inject.Inject

/**
 * Use case to fully settle a split expense.
 */
class SettleSplitUseCase @Inject constructor(
    private val repository: SplitRepository
) {
    suspend operator fun invoke(split: Split) {
        val updatedSplit = split.copy(
            isSettled = true,
            settledAmount = split.amount,
            updatedAt = System.currentTimeMillis()
        )
        repository.addSplit(updatedSplit) // addSplit uses insertWithOnConflictREPLACE
    }
}
