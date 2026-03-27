package com.titan.app.domain.usecase

import com.titan.app.domain.model.Split
import com.titan.app.domain.repository.SplitRepository
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
