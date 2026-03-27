package com.titan.app.data.repository

import com.titan.app.data.local.dao.*
import com.titan.app.data.local.entity.CashEntryEntity
import com.titan.app.data.local.entity.EmiEntity
import com.titan.app.data.local.entity.TransactionEntity
import com.titan.app.domain.model.*
import com.titan.app.domain.repository.InsightsRepository
import com.titan.app.domain.repository.SplitRepository
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
