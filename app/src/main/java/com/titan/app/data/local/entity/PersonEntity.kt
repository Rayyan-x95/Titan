package com.titan.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room entity representing a person in the split system.
 */
@Entity(tableName = "people")
data class PersonEntity(
    @PrimaryKey val id: String, // UUID or Unique Name
    val name: String
)
