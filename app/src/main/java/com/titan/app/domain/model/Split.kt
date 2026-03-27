package com.titan.app.domain.model

/**
 * Domain-level model representing a split expense.
 */
data class Split(
    val id: String,
    val amount: Double,
    val description: String,
    val paidBy: String,
    val participants: List<String>,
    val createdAt: Long
)
