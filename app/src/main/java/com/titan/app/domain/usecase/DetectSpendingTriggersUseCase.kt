package com.titan.app.domain.usecase

import com.titan.app.domain.repository.InsightsRepository
import kotlinx.coroutines.flow.*
import java.util.Calendar
import javax.inject.Inject

data class SpendingTrigger(
    val title: String,
    val description: String,
    val impact: String // Risky / High / Neutral
)

/**
 * Use case to detect impulsive or behavioral triggers.
 * E.g., Weekend spending spikes or frequent late-night transactions.
 */
class DetectSpendingTriggersUseCase @Inject constructor(
    private val repository: InsightsRepository
) {
    fun getTriggers(): Flow<List<SpendingTrigger>> = combine(
        repository.getAllSplits(),
        repository.getAllTransactions()
    ) { splits, txs ->
        val triggers = mutableListOf<SpendingTrigger>()
        
        // Weekend Detection
        val weekendSpends = (splits.map { it.createdAt } + txs.map { it.timestamp }).count { timestamp ->
            val cal = Calendar.getInstance().apply { timeInMillis = timestamp }
            val day = cal.get(Calendar.DAY_OF_WEEK)
            day == Calendar.SATURDAY || day == Calendar.SUNDAY
        }
        
        if (weekendSpends > 5) {
            triggers.add(SpendingTrigger("Weekend Spender", "You tend to spend more on weekends.", "High"))
        }

        // Impulse detection (frequent small spends)
        val smallSpends = txs.filter { it.amount < 200 }.size
        if (smallSpends > 10) {
            triggers.add(SpendingTrigger("Micro-Spending Impulse", "Frequent small spends are adding up quickly.", "Risky"))
        }

        triggers
    }
}
