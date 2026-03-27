package com.ninety5.titan.domain.model

/**
 * Domain-level model representing a group for shared expenses.
 */
data class Group(
    val id: String,
    val name: String,
    val members: List<String>,
    val createdAt: Long = System.currentTimeMillis()
)
