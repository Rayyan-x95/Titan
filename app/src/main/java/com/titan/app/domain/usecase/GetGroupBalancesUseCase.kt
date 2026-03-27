package com.titan.app.domain.usecase

import com.titan.app.domain.model.Split
import com.titan.app.domain.repository.GroupRepository
import com.titan.app.domain.repository.SplitRepository
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class GroupMemberBalance(
    val personId: String,
    val netBalance: Double // Positive = Owed to them, Negative = They owe
)

/**
 * Use case for computing aggregated balances within a group.
 */
class GetGroupBalancesUseCase @Inject constructor(
    private val splitRepository: SplitRepository
) {
    operator fun invoke(groupId: String): Flow<List<GroupMemberBalance>> {
        return splitRepository.getAllSplits().map { allSplits ->
            val groupSplits = allSplits.filter { it.groupId == groupId }
            calculateGroupBalances(groupSplits)
        }
    }

    private fun calculateGroupBalances(splits: List<Split>): List<GroupMemberBalance> {
        val balanceMap = mutableMapOf<String, Double>()

        splits.forEach { split ->
            val perPerson = split.amount / split.participants.size
            
            // Payer gets back original amount minus their own share
            balanceMap[split.paidBy] = (balanceMap[split.paidBy] ?: 0.0) + (split.amount - (if (split.participants.contains(split.paidBy)) perPerson else 0.0))
            
            // Participants owe their share (except payer who's already handled)
            split.participants.forEach { participant ->
                if (participant != split.paidBy) {
                    balanceMap[participant] = (balanceMap[participant] ?: 0.0) - perPerson
                }
            }
        }

        return balanceMap.map { (personId, balance) -> GroupMemberBalance(personId, balance) }
    }
}
