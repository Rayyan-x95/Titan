package com.titan.app.data.local.dao

import androidx.room.*
import com.titan.app.data.local.entity.EmiEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EmiDao {
    @Query("SELECT * FROM emis")
    fun getAllEmis(): Flow<List<EmiEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEmi(emi: EmiEntity)

    @Update
    suspend fun updateEmi(emi: EmiEntity)
}
