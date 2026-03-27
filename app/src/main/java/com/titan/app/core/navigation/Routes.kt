package com.ninety5.titan.core.navigation

/**
 * Defines the navigation routes for the Titan app.
 */
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object AddExpense : Screen("add_expense")
}
