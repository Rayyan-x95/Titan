package com.ninety5.titan.data.repository

import com.ninety5.titan.data.local.dao.PersonDao
import com.ninety5.titan.data.local.dao.SplitDao
import com.ninety5.titan.data.local.entity.PersonEntity
import com.ninety5.titan.data.local.entity.SplitEntity
import com.ninety5.titan.data.sync.SyncManager
import com.ninety5.titan.domain.model.Person
import com.ninety5.titan.domain.model.Split
import com.ninety5.titan.domain.repository.SplitRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SplitRepositoryImpl @Inject constructor(
    private val splitDao: SplitDao,
    private val personDao: PersonDao,
    private val syncManager: SyncManager
) : SplitRepository {

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun getAllSplits(): Flow<List<Split>> = splitDao.getAllSplits().map { entities ->
        entities.map { it.toDomain() }
    }

    override suspend fun addSplit(split: Split) {
        splitDao.insertSplit(split.toEntity())
        scope.launch { syncManager.pushToRemote() }
    }

    override fun getAllPeople(): Flow<List<Person>> = personDao.getAllPeople().map { entities ->
        entities.map { it.toDomain() }
    }

    override suspend fun addPerson(person: Person) {
        personDao.insertPerson(person.toEntity())
        scope.launch { syncManager.pushToRemote() }
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
