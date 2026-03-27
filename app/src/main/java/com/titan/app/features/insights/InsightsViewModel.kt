package com.ninety5.titan.features.insights

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ninety5.titan.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class InsightsUiState(
    val healthScore: HealthScore? = null,
    val triggers: List<SpendingTrigger> = emptyList(),
    val trends: List<SpendTrend> = emptyList(),
    val overspending: Boolean = false,
    val payFirstPercentage: Double = 0.0,
    val reverseInsight: ReverseInsight? = null
)

@HiltViewModel
class InsightsViewModel @Inject constructor(
    private val healthScoreUseCase: CalculateFinancialHealthScoreUseCase,
    private val triggersUseCase: DetectSpendingTriggersUseCase,
    private val patternsUseCase: GetSpendingPatternsUseCase,
    private val overspendingUseCase: PredictOverspendingUseCase,
    private val payFirstUseCase: DetectAlwaysPaysFirstUseCase,
    private val reverseInsightsUseCase: ReverseInsightsUseCase
) : ViewModel() {

    val uiState: StateFlow<InsightsUiState> = combine(
        healthScoreUseCase.getScore(),
        triggersUseCase.getTriggers(),
        patternsUseCase.invoke(),
        overspendingUseCase.isOverspending(),
        payFirstUseCase.detect()
    ) { health, triggers, trends, overspending, payFirst ->
        val totalSpent = trends.sumOf { it.totalAmount }
        InsightsUiState(
            healthScore = health,
            triggers = triggers,
            trends = trends,
            overspending = overspending,
            payFirstPercentage = payFirst,
            reverseInsight = if (totalSpent > 0) reverseInsightsUseCase.map(totalSpent) else null
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = InsightsUiState()
    )
}
