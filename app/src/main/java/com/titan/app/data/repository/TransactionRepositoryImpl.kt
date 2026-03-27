package com.titan.app.data.repository

import com.titan.app.data.local.dao.TransactionDao
import com.titan.app.data.local.entity.TransactionEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransactionRepositoryImpl @Inject constructor(
    private val transactionDao: TransactionDao
) {
    fun getAllTransactions(): Flow<List<TransactionEntity>> = transactionDao.getAllTransactions()
    
    suspend fun approveTransaction(id: String) {
        // Logic to move to splits or just mark approved
    }

    suspend fun deleteTransaction(id: String) = transactionDao.deleteById(id)
}
