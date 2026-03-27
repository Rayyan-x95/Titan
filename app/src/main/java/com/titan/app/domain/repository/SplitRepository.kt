package com.titan.app.domain.repository

import com.titan.app.domain.model.Person
import com.titan.app.domain.model.Split
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for managing Split and Person data.
 */
interface SplitRepository {
    fun getAllSplits(): Flow<List<Split>>
    suspend fun addSplit(split: Split)
    
    fun getAllPeople(): Flow<List<Person>>
    suspend fun addPerson(person: Person)
    suspend fun getPersonById(id: String): Person?
}
