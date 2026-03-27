package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.repository.InsightsRepository
import kotlinx.coroutines.flow.*
import javax.inject.Inject

enum class FinancialHealthStatus { GOOD, MODERATE, RISKY }

data class HealthScore(
    val score: Int, // 0 to 100
    val status: FinancialHealthStatus,
    val recommendation: String
)

/**
 * Calculates a financial health score based on debt-to-income (EMI load),
 * pending dues, and current savings behavior.
 */
class CalculateFinancialHealthScoreUseCase @Inject constructor(
    private val repository: InsightsRepository
) {
    fun getScore(): Flow<HealthScore> = combine(
        repository.getAllEmis(),
        repository.getAllSplits()
    ) { emis, splits ->
        val emiLoad = emis.filter { it.isActive }.sumOf { it.amount }
        val pendingOwed = splits.filter { !it.isSettled }.sumOf { it.amount }
        
        var baseScore = 85
        
        // Deduct for high EMI load (simple threshold)
        if (emiLoad > 10000) baseScore -= 20
        if (pendingOwed > 5000) baseScore -= 10
        
        val status = when {
            baseScore >= 75 -> FinancialHealthStatus.GOOD
            baseScore >= 50 -> FinancialHealthStatus.MODERATE
            else -> FinancialHealthStatus.RISKY
        }

        val recommendation = when(status) {
            FinancialHealthStatus.GOOD -> "Your financial health is solid. Keep tracking!"
            FinancialHealthStatus.MODERATE -> "Consider reducing small splits to improve flow."
            FinancialHealthStatus.RISKY -> "High EMI load detected. Avoid new splits this month."
        }

        HealthScore(baseScore, status, recommendation)
    }
}
