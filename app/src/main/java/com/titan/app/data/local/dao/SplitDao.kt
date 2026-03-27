package com.titan.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.titan.app.data.local.entity.SplitEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for managing SplitEntity in the Room database.
 */
@Dao
interface SplitDao {
    @Query("SELECT * FROM splits ORDER BY createdAt DESC")
    fun getAllSplits(): Flow<List<SplitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSplit(split: SplitEntity)

    @Query("SELECT * FROM splits WHERE paidBy = :personId")
    fun getSplitsByPayer(personId: String): Flow<List<SplitEntity>>
}
