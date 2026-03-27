package com.titan.app.data.local.dao

import androidx.room.*
import com.titan.app.data.local.entity.CashEntryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CashDao {
    @Query("SELECT * FROM cash_entries ORDER BY timestamp DESC")
    fun getAllCashEntries(): Flow<List<CashEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCashEntry(entry: CashEntryEntity)
}
