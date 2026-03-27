package com.titan.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room entity representing a split expense transaction.
 */
@Entity(tableName = "splits")
data class SplitEntity(
    @PrimaryKey val id: String,
    val amount: Double,
    val description: String,
    val paidBy: String, // ID of the person who paid
    val participants: List<String>, // List of IDs of people involved
    val createdAt: Long
)
