package com.ninety5.titan.domain.model

/**
 * Domain-level model representing a split expense.
 */
data class Split(
    val id: String,
    val amount: Double,
    val description: String,
    val paidBy: String,
    val participants: List<String>,
    val createdAt: Long,
    val isSettled: Boolean = false,
    val settledAmount: Double = 0.0,
    val updatedAt: Long = System.currentTimeMillis()
)
