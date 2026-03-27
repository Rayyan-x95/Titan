package com.ninety5.titan.domain.repository

import com.ninety5.titan.domain.model.Group
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for managing financial groups.
 */
interface GroupRepository {
    fun getAllGroups(): Flow<List<Group>>
    suspend fun addGroup(group: Group)
    suspend fun getGroupById(id: String): Group?
}
