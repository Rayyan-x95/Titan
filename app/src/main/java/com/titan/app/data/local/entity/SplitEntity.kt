package com.ninety5.titan.data.local.entity

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
    val paidBy: String, 
    val participants: List<String>, 
    val createdAt: Long,
    val isSettled: Boolean = false,
    val settledAmount: Double = 0.0,
    val updatedAt: Long = System.currentTimeMillis(),
    val groupId: String? = null // Nullable to support individual splits
)
