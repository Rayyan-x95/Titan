package com.titan.app.domain.usecase

import com.titan.app.domain.model.Split
import com.titan.app.domain.repository.SplitRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/**
 * Represents the balance for a specific person.
 */
data class PersonBalance(
    val personId: String,
    val amount: Double // Positive means they owe you, negative means you owe them
)

/**
 * Use case for calculating balances for all people.
 */
class GetBalancesUseCase @Inject constructor(
    private val repository: SplitRepository
) {
    operator fun invoke(currentUser: String): Flow<List<PersonBalance>> {
        return repository.getAllSplits().map { splits ->
            calculateBalances(splits, currentUser)
        }
    }

    private fun calculateBalances(splits: List<Split>, currentUser: String): List<PersonBalance> {
        val balances = mutableMapOf<String, Double>()

        splits.forEach { split ->
            val splitAmount = split.amount / split.participants.size
            
            if (split.paidBy == currentUser) {
                // User paid, others owe the user
                split.participants.forEach { participant ->
                    if (participant != currentUser) {
                        balances[participant] = (balances[participant] ?: 0.0) + splitAmount
                    }
                }
            } else if (split.participants.contains(currentUser)) {
                // Someone else paid, user was a participant
                val payer = split.paidBy
                balances[payer] = (balances[payer] ?: 0.0) - splitAmount
            }
        }

        return balances.map { (personId, amount) -> PersonBalance(personId, amount) }
    }
}
