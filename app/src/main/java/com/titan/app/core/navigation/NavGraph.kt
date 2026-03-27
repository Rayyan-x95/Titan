package com.titan.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.titan.app.features.split.*

/**
 * Defines the navigation routes for the Titan app.
 */
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object AddExpense : Screen("add_expense")
    object History : Screen("history")
    object PersonDetail : Screen("person_detail/{personId}") {
        fun createRoute(personId: String) = "person_detail/$personId"
    }
    object Settlement : Screen("settlement/{splitId}") {
        fun createRoute(splitId: String) = "settlement/$splitId"
    }
}

/**
 * Navigation Graph defining all screens and their destinations.
 */
@Composable
fun NavGraph() {
    val navController = rememberNavController()
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToAddExpense = {
                    navController.navigate(Screen.AddExpense.route)
                },
                onNavigateToPersonDetail = { personId ->
                    navController.navigate(Screen.PersonDetail.createRoute(personId))
                },
                onNavigateToHistory = {
                    navController.navigate(Screen.History.route)
                }
            )
        }
        composable(Screen.AddExpense.route) {
            AddExpenseScreen(onBack = {
                navController.popBackStack()
            })
        }
        composable(Screen.History.route) {
            SplitHistoryScreen(onBack = {
                navController.popBackStack()
            })
        }
        composable(
            route = Screen.PersonDetail.route,
            arguments = listOf(navArgument("personId") { type = NavType.StringType })
        ) {
            PersonDetailScreen(
                onBack = {
                    navController.popBackStack()
                },
                onNavigateToSettlement = { splitId ->
                    navController.navigate(Screen.Settlement.createRoute(splitId))
                }
            )
        }
        composable(
            route = Screen.Settlement.route,
            arguments = listOf(navArgument("splitId") { type = NavType.StringType })
        ) { backStackEntry ->
            val splitId = backStackEntry.arguments?.getString("splitId") ?: ""
            SettlementScreen(
                onBack = {
                    navController.popBackStack()
                },
                splitId = splitId
            )
        }
    }
}
