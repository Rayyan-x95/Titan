package com.titan.app.features.split

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.titan.app.domain.model.Split
import com.titan.app.domain.usecase.AddSplitUseCase
import com.titan.app.domain.usecase.GetBalancesUseCase
import com.titan.app.domain.usecase.PersonBalance
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class SplitUiState(
    val balances: List<PersonBalance> = emptyList(),
    val totalOwed: Double = 0.0,
    val totalOwe: Double = 0.0,
    val isLoading: Boolean = false
)

@HiltViewModel
class SplitViewModel @Inject constructor(
    private val addSplitUseCase: AddSplitUseCase,
    private val getBalancesUseCase: GetBalancesUseCase
) : ViewModel() {

    private val currentUser = "Me" // Placeholder for current user ID

    val uiState: StateFlow<SplitUiState> = getBalancesUseCase(currentUser)
        .map { balances ->
            val owed = balances.filter { it.amount > 0 }.sumOf { it.amount }
            val owe = balances.filter { it.amount < 0 }.sumOf { kotlin.math.abs(it.amount) }
            SplitUiState(balances = balances, totalOwed = owed, totalOwe = owe)
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
}
