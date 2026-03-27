package com.titan.app.domain.usecase

import com.titan.app.data.local.dao.CashDao
import com.titan.app.data.local.entity.CashEntryEntity
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject

/**
 * Use case for managing manual cash flows.
 */
class TrackCashFlowUseCase @Inject constructor(
    private val cashDao: CashDao
) {
    fun getEntries(): Flow<List<CashEntryEntity>> = cashDao.getAllCashEntries()

    suspend fun addEntry(amount: Double, type: String) {
        cashDao.insertCashEntry(
            CashEntryEntity(
                id = UUID.randomUUID().toString(),
                amount = amount,
                type = type
            )
        )
    }
}
