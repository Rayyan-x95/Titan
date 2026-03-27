package com.ninety5.titan.domain.repository

import com.ninety5.titan.data.local.entity.CashEntryEntity
import com.ninety5.titan.data.local.entity.EmiEntity
import com.ninety5.titan.data.local.entity.TransactionEntity
import com.ninety5.titan.domain.model.Split
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
