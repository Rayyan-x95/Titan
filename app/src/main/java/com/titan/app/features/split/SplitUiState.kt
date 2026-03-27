package com.ninety5.titan.features.split

/**
 * Represents the UI state for the Split feature.
 */
data class SplitUiState(
    val isLoading: Boolean = false,
    val expenses: List<String> = emptyList() // Placeholder
)
