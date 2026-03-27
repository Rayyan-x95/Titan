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
    val isSyncing: Boolean = false,
    val isLoading: Boolean = false
)

@HiltViewModel
class SplitViewModel @Inject constructor(
    private val addSplitUseCase: AddSplitUseCase,
    private val getBalancesUseCase: GetBalancesUseCase,
    private val getSummaryInsightsUseCase: GetSummaryInsightsUseCase,
    private val settleSplitUseCase: SettleSplitUseCase,
    private val partiallySettleSplitUseCase: PartiallySettleSplitUseCase,
    private val syncDataUseCase: SyncDataUseCase,
    private val repository: com.titan.app.domain.repository.SplitRepository
) : ViewModel() {

    private val currentUser = "Me"
    private val _isSyncing = MutableStateFlow(false)

    val uiState: StateFlow<SplitUiState> = combine(
        getBalancesUseCase(currentUser),
        getSummaryInsightsUseCase(currentUser),
        repository.getAllSplits(),
        _isSyncing
    ) { balances, insights, history, syncing ->
        val owed = balances.filter { it.amount > 0 }.sumOf { it.amount }
        val owe = balances.filter { it.amount < 0 }.sumOf { kotlin.math.abs(it.amount) }
        SplitUiState(
            balances = balances, 
            totalOwed = owed, 
            totalOwe = owe, 
            summaryInsights = insights,
            allHistory = history,
            isSyncing = syncing
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = SplitUiState(isLoading = true)
    )

    init {
        triggerSync()
    }

    fun triggerSync() {
        viewModelScope.launch {
            _isSyncing.value = true
            try {
                syncDataUseCase()
            } catch (e: Exception) {
                // Silent error in background
            } finally {
                _isSyncing.value = false
            }
        }
    }

    fun addSplit(amount: Double, description: String, participants: List<String>, groupId: String? = null) {
        viewModelScope.launch {
            val newSplit = Split(
                id = UUID.randomUUID().toString(),
                amount = amount,
                description = description,
                paidBy = currentUser,
                participants = participants + currentUser,
                createdAt = System.currentTimeMillis(),
                groupId = groupId
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
