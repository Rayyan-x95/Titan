package com.titan.app.core.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.titan.app.features.split.*
import com.titan.app.features.group.*

sealed class Routes(val route: String) {
    object Home : Routes("home")
    object AddExpense : Routes("add_expense?groupId={groupId}") {
        fun createRoute(groupId: String? = null) = "add_expense" + (groupId?.let { "?groupId=$it" } ?: "")
    }
    object SplitHistory : Routes("split_history")
    object PersonDetail : Routes("person_detail/{personId}") {
        fun createRoute(personId: String) = "person_detail/$personId"
    }
    object Settlement : Routes("settlement/{splitId}") {
        fun createRoute(splitId: String) = "settlement/$splitId"
    }
    object GroupList : Routes("group_list")
    object AddGroup : Routes("add_group")
    object GroupDetail : Routes("group_detail/{groupId}") {
        fun createRoute(groupId: String) = "group_detail/$groupId"
    }
    object SmsTransactions : Routes("sms_transactions")
    object CashTracker : Routes("cash_tracker")
    object EmiTracker : Routes("emi_tracker")
    object RentSplit : Routes("rent_split")
    object InsightsHub : Routes("insights_hub")
    object SpendingPatterns : Routes("spending_patterns")
    object Triggers : Routes("triggers")
    object FinancialHealth : Routes("financial_health")
}

@Composable
fun NavGraph() {
    val navController = rememberNavController()
    NavHost(
        navController = navController,
        startDestination = Routes.Home.route
    ) {
        composable(Routes.Home.route) {
            HomeScreen(
                onNavigateToAddExpense = {
                    navController.navigate(Routes.AddExpense.createRoute())
                },
                onNavigateToPersonDetail = { personId ->
                    navController.navigate(Routes.PersonDetail.createRoute(personId))
                },
                onNavigateToHistory = {
                    navController.navigate(Routes.SplitHistory.route)
                },
                onNavigateToGroups = {
                    navController.navigate(Routes.GroupList.route)
                },
                onNavigateToSms = {
                    navController.navigate(Routes.SmsTransactions.route)
                },
                onNavigateToCash = {
                    navController.navigate(Routes.CashTracker.route)
                },
                onNavigateToEmi = {
                    navController.navigate(Routes.EmiTracker.route)
                },
                onNavigateToRent = {
                    navController.navigate(Routes.RentSplit.route)
                },
                onNavigateToInsights = {
                    navController.navigate(Routes.InsightsHub.route)
                }
            )
        }

        composable(
            route = Routes.AddExpense.route,
            arguments = listOf(navArgument("groupId") {
                type = NavType.StringType
                nullable = true
            })
        ) { backStackEntry ->
            val groupId = backStackEntry.arguments?.getString("groupId")
            AddExpenseScreen(
                onBack = { navController.popBackStack() },
                initialGroupId = groupId
            )
        }

        composable(Routes.SplitHistory.route) {
            SplitHistoryScreen(onBack = { navController.popBackStack() })
        }

        composable(
            route = Routes.PersonDetail.route,
            arguments = listOf(navArgument("personId") { type = NavType.StringType })
        ) { backStackEntry ->
            val personId = backStackEntry.arguments?.getString("personId") ?: return@composable
            PersonDetailScreen(
                onBack = { navController.popBackStack() },
                onNavigateToSettlement = { splitId ->
                    navController.navigate(Routes.Settlement.createRoute(splitId))
                }
            )
        }

        composable(
            route = Routes.Settlement.route,
            arguments = listOf(navArgument("splitId") { type = NavType.StringType })
        ) { backStackEntry ->
            val splitId = backStackEntry.arguments?.getString("splitId") ?: return@composable
            SettlementScreen(
                splitId = splitId,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.GroupList.route) {
            GroupListScreen(
                onNavigateToGroupDetail = { groupId ->
                    navController.navigate(Routes.GroupDetail.createRoute(groupId))
                },
                onNavigateToAddGroup = {
                    navController.navigate(Routes.AddGroup.route)
                }
            )
        }

        composable(Routes.AddGroup.route) {
            AddGroupScreen(onBack = { navController.popBackStack() })
        }

        composable(
            route = Routes.GroupDetail.route,
            arguments = listOf(navArgument("groupId") { type = NavType.StringType })
        ) { backStackEntry ->
            val groupId = backStackEntry.arguments?.getString("groupId") ?: return@composable
            GroupDetailScreen(
                groupId = groupId,
                onBack = { navController.popBackStack() },
                onNavigateToAddExpense = { gid ->
                    navController.navigate(Routes.AddExpense.createRoute(gid))
                }
            )
        }

        composable(Routes.SmsTransactions.route) {
            SmsTransactionsScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.CashTracker.route) {
            CashTrackerScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.EmiTracker.route) {
            EmiTrackerScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.RentSplit.route) {
            RentSplitScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.InsightsHub.route) {
            InsightsScreen(
                onBack = { navController.popBackStack() },
                onNavigateToPatterns = { navController.navigate(Routes.SpendingPatterns.route) },
                onNavigateToTriggers = { navController.navigate(Routes.Triggers.route) },
                onNavigateToHealth = { navController.navigate(Routes.FinancialHealth.route) }
            )
        }

        composable(Routes.SpendingPatterns.route) {
            SpendingPatternsScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.Triggers.route) {
            TriggersScreen(onBack = { navController.popBackStack() })
        }

        composable(Routes.FinancialHealth.route) {
            FinancialHealthScreen(onBack = { navController.popBackStack() })
        }
    }
}
