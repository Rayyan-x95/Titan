package com.titan.app.data.local.entity

import androidx.room.*

/**
 * Room entity for parsed bank/UPI transactions requiring user approval.
 */
@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey val id: String,
    val amount: Double,
    val type: String, // UPI, CARD, CASH
    val merchant: String,
    val timestamp: Long,
    val isApproved: Boolean = false
)
