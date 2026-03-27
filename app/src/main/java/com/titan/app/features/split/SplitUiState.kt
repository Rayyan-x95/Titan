package com.titan.app.features.split

/**
 * Represents the UI state for the Split feature.
 */
data class SplitUiState(
    val isLoading: Boolean = false,
    val expenses: List<String> = emptyList() // Placeholder
)
