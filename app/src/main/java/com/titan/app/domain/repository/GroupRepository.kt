package com.titan.app.domain.repository

import com.titan.app.domain.model.Group
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for managing financial groups.
 */
interface GroupRepository {
    fun getAllGroups(): Flow<List<Group>>
    suspend fun addGroup(group: Group)
    suspend fun getGroupById(id: String): Group?
}
