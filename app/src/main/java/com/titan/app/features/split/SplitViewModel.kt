package com.titan.app.features.split

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.titan.app.domain.model.Split
import com.titan.app.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class SplitUiState(
    val balances: List<PersonBalance> = emptyList(),
    val totalOwed: Double = 0.0,
    val totalOwe: Double = 0.0,
    val summaryInsights: SummaryInsights? = null,
    val allHistory: List<Split> = emptyList(),
    val isLoading: Boolean = false
)

@HiltViewModel
class SplitViewModel @Inject constructor(
    private val addSplitUseCase: AddSplitUseCase,
    private val getBalancesUseCase: GetBalancesUseCase,
    private val getSummaryInsightsUseCase: GetSummaryInsightsUseCase,
    private val settleSplitUseCase: SettleSplitUseCase,
    private val partiallySettleSplitUseCase: PartiallySettleSplitUseCase,
    private val repository: com.titan.app.domain.repository.SplitRepository // To get all splits for history
) : ViewModel() {

    private val currentUser = "Me"

    val uiState: StateFlow<SplitUiState> = combine(
        getBalancesUseCase(currentUser),
        getSummaryInsightsUseCase(currentUser),
        repository.getAllSplits()
    ) { balances, insights, history ->
        val owed = balances.filter { it.amount > 0 }.sumOf { it.amount }
        val owe = balances.filter { it.amount < 0 }.sumOf { kotlin.math.abs(it.amount) }
        SplitUiState(
            balances = balances, 
            totalOwed = owed, 
            totalOwe = owe, 
            summaryInsights = insights,
            allHistory = history
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = SplitUiState(isLoading = true)
    )

    fun addSplit(amount: Double, description: String, participants: List<String>) {
        viewModelScope.launch {
            val newSplit = Split(
                id = UUID.randomUUID().toString(),
                amount = amount,
                description = description,
                paidBy = currentUser,
                participants = participants + currentUser,
                createdAt = System.currentTimeMillis()
            )
            addSplitUseCase(newSplit)
        }
    }

    fun settleFull(split: Split) {
        viewModelScope.launch {
            settleSplitUseCase(split)
        }
    }

    fun settlePartial(split: Split, amount: Double) {
        viewModelScope.launch {
            partiallySettleSplitUseCase(split, amount)
        }
    }
}
