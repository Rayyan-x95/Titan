package com.ninety5.titan.data.repository

import com.ninety5.titan.data.local.dao.TransactionDao
import com.ninety5.titan.data.local.entity.TransactionEntity
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
