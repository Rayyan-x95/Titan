package com.ninety5.titan.data.local.dao

import androidx.room.*
import com.ninety5.titan.data.local.entity.EmiEntity
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
