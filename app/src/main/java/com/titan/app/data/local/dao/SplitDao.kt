package com.ninety5.titan.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.ninety5.titan.data.local.entity.SplitEntity
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

    @Update
    suspend fun updateSplit(split: SplitEntity)

    @Query("SELECT * FROM splits WHERE paidBy = :personId OR :personId IN (participants) ORDER BY createdAt DESC")
    fun getSplitsByPerson(personId: String): Flow<List<SplitEntity>>

    @Query("SELECT * FROM splits WHERE isSettled = 0 ORDER BY createdAt ASC")
    fun getPendingSplits(): Flow<List<SplitEntity>>
}
