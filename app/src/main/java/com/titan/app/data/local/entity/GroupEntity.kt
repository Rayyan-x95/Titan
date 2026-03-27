package com.ninety5.titan.data.local.entity

import androidx.room.*

/**
 * Room entity representing a group of people for shared expenses.
 */
@Entity(tableName = "groups")
data class GroupEntity(
    @PrimaryKey val id: String,
    val name: String,
    val members: List<String>, // Participant IDs
    val createdAt: Long = System.currentTimeMillis()
)
