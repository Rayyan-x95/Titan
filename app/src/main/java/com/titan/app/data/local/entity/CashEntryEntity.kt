package com.titan.app.data.local.entity

import androidx.room.*

/**
 * Room entity for tracking manual cash inflows and outflows.
 */
@Entity(tableName = "cash_entries")
data class CashEntryEntity(
    @PrimaryKey val id: String,
    val amount: Double,
    val type: String, // IN, OUT
    val timestamp: Long = System.currentTimeMillis()
)
