package com.ninety5.titan.data.local.dao

import androidx.room.*
import com.ninety5.titan.data.local.entity.GroupEntity
import kotlinx.coroutines.flow.Flow

/**
 * DAO for managing GroupEntity in the Room database.
 */
@Dao
interface GroupDao {
    @Query("SELECT * FROM groups ORDER BY createdAt DESC")
    fun getAllGroups(): Flow<List<GroupEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGroup(group: GroupEntity)

    @Query("SELECT * FROM groups WHERE id = :groupId")
    suspend fun getGroupById(groupId: String): GroupEntity?

    @Delete
    suspend fun deleteGroup(group: GroupEntity)
}
