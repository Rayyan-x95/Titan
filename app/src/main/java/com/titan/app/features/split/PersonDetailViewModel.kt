package com.titan.app.features.split

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.titan.app.domain.model.Split
import com.titan.app.domain.usecase.GetBalancesUseCase
import com.titan.app.domain.usecase.GetSplitsByPersonUseCase
import com.titan.app.domain.usecase.PersonBalance
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class PersonDetailUiState(
    val personId: String = "",
    val balance: Double = 0.0,
    val transactions: List<Split> = emptyList(),
    val isLoading: Boolean = false
)

@HiltViewModel
class PersonDetailViewModel @Inject constructor(
    private val getSplitsByPersonUseCase: GetSplitsByPersonUseCase,
    private val getBalancesUseCase: GetBalancesUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val personId: String = savedStateHandle.get<String>("personId") ?: ""
    private val currentUser = "Me"

    val uiState: StateFlow<PersonDetailUiState> = combine(
        getBalancesUseCase(currentUser),
        getSplitsByPersonUseCase(personId, currentUser)
    ) { balances, transactions ->
        val balance = balances.find { it.personId == personId }?.amount ?: 0.0
        PersonDetailUiState(personId = personId, balance = balance, transactions = transactions)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = PersonDetailUiState(isLoading = true)
    )
}
