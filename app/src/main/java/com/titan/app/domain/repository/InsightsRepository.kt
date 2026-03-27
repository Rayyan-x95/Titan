package com.titan.app.domain.repository

import com.titan.app.data.local.entity.CashEntryEntity
import com.titan.app.data.local.entity.EmiEntity
import com.titan.app.data.local.entity.TransactionEntity
import com.titan.app.domain.model.Split
import kotlinx.coroutines.flow.Flow

/**
 * Interface for aggregating financial data for behavioral analysis.
 */
interface InsightsRepository {
    fun getAllSplits(): Flow<List<Split>>
    fun getAllTransactions(): Flow<List<TransactionEntity>>
    fun getAllCashEntries(): Flow<List<CashEntryEntity>>
    fun getAllEmis(): Flow<List<EmiEntity>>
}
