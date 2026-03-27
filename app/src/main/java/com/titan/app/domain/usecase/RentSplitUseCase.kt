package com.titan.app.domain.usecase

import com.titan.app.domain.model.Split
import com.titan.app.domain.repository.SplitRepository
import java.util.UUID
import javax.inject.Inject

/**
 * Use case for monthly recurring rent splits.
 */
class RentSplitUseCase @Inject constructor(
    private val splitRepository: SplitRepository
) {
    suspend fun triggerMonthlySplit(amount: Double, participants: List<String>) {
        val split = Split(
            id = UUID.randomUUID().toString(),
            amount = amount,
            description = "Monthly Rent",
            paidBy = "Me",
            participants = participants,
            createdAt = System.currentTimeMillis()
        )
        splitRepository.addSplit(split)
    }
}
