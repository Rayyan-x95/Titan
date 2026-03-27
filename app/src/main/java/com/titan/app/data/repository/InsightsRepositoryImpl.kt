package com.ninety5.titan.data.repository

import com.ninety5.titan.data.local.dao.*
import com.ninety5.titan.data.local.entity.CashEntryEntity
import com.ninety5.titan.data.local.entity.EmiEntity
import com.ninety5.titan.data.local.entity.TransactionEntity
import com.ninety5.titan.domain.model.*
import com.ninety5.titan.domain.repository.InsightsRepository
import com.ninety5.titan.domain.repository.SplitRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InsightsRepositoryImpl @Inject constructor(
    private val splitRepository: SplitRepository,
    private val transactionDao: TransactionDao,
    private val cashDao: CashDao,
    private val emiDao: EmiDao
) : InsightsRepository {

    override fun getAllSplits(): Flow<List<Split>> = splitRepository.getAllSplits()

    override fun getAllTransactions(): Flow<List<TransactionEntity>> = transactionDao.getAllTransactions()

    override fun getAllCashEntries(): Flow<List<CashEntryEntity>> = cashDao.getAllCashEntries()

    override fun getAllEmis(): Flow<List<EmiEntity>> = emiDao.getAllEmis()
}
