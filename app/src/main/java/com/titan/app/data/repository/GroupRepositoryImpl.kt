package com.titan.app.data.repository

import com.titan.app.data.local.dao.GroupDao
import com.titan.app.data.local.entity.GroupEntity
import com.titan.app.data.sync.SyncManager
import com.titan.app.domain.model.Group
import com.titan.app.domain.repository.GroupRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GroupRepositoryImpl @Inject constructor(
    private val groupDao: GroupDao,
    private val syncManager: SyncManager
) : GroupRepository {

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun getAllGroups(): Flow<List<Group>> = groupDao.getAllGroups().map { entities ->
        entities.map { it.toDomain() }
    }

    override suspend fun addGroup(group: Group) {
        groupDao.insertGroup(group.toEntity())
        scope.launch { syncManager.pushToRemote() }
    }

    override suspend fun getGroupById(id: String): Group? {
        return groupDao.getGroupById(id)?.toDomain()
    }

    private fun GroupEntity.toDomain() = Group(id, name, members, createdAt)
    private fun Group.toEntity() = GroupEntity(id, name, members, createdAt)
}
