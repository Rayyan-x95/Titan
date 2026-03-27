package com.ninety5.titan.features.india

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ninety5.titan.data.local.dao.TransactionDao
import com.ninety5.titan.data.local.entity.TransactionEntity
import com.ninety5.titan.data.local.entity.CashEntryEntity
import com.ninety5.titan.data.local.entity.EmiEntity
import com.ninety5.titan.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class IndiaLayerUiState(
    val transactions: List<TransactionEntity> = emptyList(),
    val cashEntries: List<CashEntryEntity> = emptyList(),
    val emis: List<EmiEntity> = emptyList(),
    val cashBalance: Double = 0.0
)

@HiltViewModel
class IndiaLayerViewModel @Inject constructor(
    private val transactionDao: TransactionDao,
    private val trackCashFlowUseCase: TrackCashFlowUseCase,
    private val manageEmiUseCase: ManageEmiUseCase,
    private val rentSplitUseCase: RentSplitUseCase
) : ViewModel() {

    val uiState: StateFlow<IndiaLayerUiState> = combine(
        transactionDao.getAllTransactions(),
        trackCashFlowUseCase.getEntries(),
        manageEmiUseCase.getAllEmis()
    ) { txs, cash, emis ->
        val balance = cash.sumOf { if (it.type == "IN") it.amount else -it.amount }
        IndiaLayerUiState(
            transactions = txs,
            cashEntries = cash,
            emis = emis,
            cashBalance = balance
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = IndiaLayerUiState()
    )

    fun approveTransaction(transaction: TransactionEntity) {
        viewModelScope.launch {
            transactionDao.updateTransaction(transaction.copy(isApproved = true))
            // Optionally convert to a Split later
        }
    }

    fun deleteTransaction(id: String) {
        viewModelScope.launch {
            transactionDao.deleteById(id)
        }
    }

    fun addCashEntry(amount: Double, type: String) {
        viewModelScope.launch {
            trackCashFlowUseCase.addEntry(amount, type)
        }
    }

    fun addEmi(name: String, amount: Double, dueDate: Long) {
        viewModelScope.launch {
            manageEmiUseCase.addEmi(name, amount, dueDate)
        }
    }

    fun triggerRentSplit(amount: Double, members: List<String>) {
        viewModelScope.launch {
            rentSplitUseCase.triggerMonthlySplit(amount, members)
        }
    }
}
