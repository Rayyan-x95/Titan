package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.model.Split
import com.ninety5.titan.domain.repository.SplitRepository
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
