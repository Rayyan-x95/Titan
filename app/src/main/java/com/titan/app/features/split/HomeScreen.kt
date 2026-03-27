package com.titan.app.features.split

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.titan.app.core.designsystem.theme.Primary
import com.titan.app.core.designsystem.theme.PrimaryDim

@Composable
fun HomeScreen(
    onNavigateToAddExpense: () -> Unit,
    onNavigateToPersonDetail: (String) -> Unit,
    onNavigateToHistory: () -> Unit,
    viewModel: SplitViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "TITAN VAULT / BALANCE",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = MaterialTheme.colorScheme.secondary,
                    fontWeight = FontWeight.Bold
                )
            )
            TextButton(onClick = onNavigateToHistory) {
                Text("View History", style = MaterialTheme.typography.labelSmall)
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Summary Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surfaceContainer,
            shape = RoundedCornerShape(24.dp)
        ) {
            Row(
                modifier = Modifier.padding(24.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("You are owed", style = MaterialTheme.typography.labelSmall)
                    Text("₹${uiState.totalOwed}", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.tertiary)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("You owe", style = MaterialTheme.typography.labelSmall)
                    Text("₹${uiState.totalOwe}", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.error)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Insights
        uiState.summaryInsights?.let { insights ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.surfaceContainerLow,
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("QUICK INSIGHTS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "You are owed ₹${insights.totalPendingAmount} from ${insights.peopleWhoOweCount} people.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    insights.oldestPendingSplit?.let { oldest ->
                        Text(
                            text = "Oldest pending: ${oldest.description.ifEmpty { "Expense" }} (₹${oldest.amount})",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text("PEOPLE", style = MaterialTheme.typography.labelSmall)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(uiState.balances) { balance ->
                PersonBalanceItem(
                    balance = balance,
                    onClick = { onNavigateToPersonDetail(balance.personId) }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
        
        Button(
            onClick = onNavigateToAddExpense,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = RoundedCornerShape(24.dp),
            colors = ButtonDefaults.buttonColors(containerColor = androidx.compose.ui.graphics.Color.Transparent),
            contentPadding = PaddingValues()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(Primary, PrimaryDim)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text("+ Add Expense", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onPrimary)
            }
        }
    }
}
