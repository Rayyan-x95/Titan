package com.ninety5.titan.data.local.entity

import androidx.room.*

/**
 * Room entity for tracking Equated Monthly Installments (EMIs).
 */
@Entity(tableName = "emis")
data class EmiEntity(
    @PrimaryKey val id: String,
    val name: String,
    val amount: Double,
    val dueDate: Long,
    val isActive: Boolean = true
)
