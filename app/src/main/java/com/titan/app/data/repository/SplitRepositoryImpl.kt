package com.titan.app.data.repository

import com.titan.app.data.local.dao.PersonDao
import com.titan.app.data.local.dao.SplitDao
import com.titan.app.data.local.entity.PersonEntity
import com.titan.app.data.local.entity.SplitEntity
import com.titan.app.domain.model.Person
import com.titan.app.domain.model.Split
import com.titan.app.domain.repository.SplitRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SplitRepositoryImpl @Inject constructor(
    private val splitDao: SplitDao,
    private val personDao: PersonDao
) : SplitRepository {

    override fun getAllSplits(): Flow<List<Split>> = splitDao.getAllSplits().map { entities ->
        entities.map { it.toDomain() }
    }

    override suspend fun addSplit(split: Split) {
        splitDao.insertSplit(split.toEntity())
    }

    override fun getAllPeople(): Flow<List<Person>> = personDao.getAllPeople().map { entities ->
        entities.map { it.toDomain() }
    }

    override suspend fun addPerson(person: Person) {
        personDao.insertPerson(person.toEntity())
    }

    override suspend fun getPersonById(id: String): Person? {
        return personDao.getPersonById(id)?.toDomain()
    }

    // Mapper extensions
    private fun SplitEntity.toDomain() = Split(id, amount, description, paidBy, participants, createdAt, isSettled, settledAmount, updatedAt)
    private fun Split.toEntity() = SplitEntity(id, amount, description, paidBy, participants, createdAt, isSettled, settledAmount, updatedAt)
    private fun PersonEntity.toDomain() = Person(id, name)
    private fun Person.toEntity() = PersonEntity(id, name)
}
