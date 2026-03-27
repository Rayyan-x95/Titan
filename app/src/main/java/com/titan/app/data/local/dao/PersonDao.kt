package com.ninety5.titan.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ninety5.titan.data.local.entity.PersonEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for managing PersonEntity in the Room database.
 */
@Dao
interface PersonDao {
    @Query("SELECT * FROM people")
    fun getAllPeople(): Flow<List<PersonEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPerson(person: PersonEntity)
    
    @Query("SELECT * FROM people WHERE id = :id")
    suspend fun getPersonById(id: String): PersonEntity?
}
