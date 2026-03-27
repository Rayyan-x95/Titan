package com.titan.app.features.split

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.titan.app.core.designsystem.components.GlassCard
import com.titan.app.core.designsystem.components.HeroBalance
import com.titan.app.core.designsystem.theme.Primary
import com.titan.app.core.designsystem.theme.Secondary

@Composable
fun HomeScreen(
    onNavigateToAddExpense: () -> Unit,
    onNavigateToPersonDetail: (String) -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToGroups: () -> Unit,
    onNavigateToSms: () -> Unit,
    onNavigateToCash: () -> Unit,
    onNavigateToEmi: () -> Unit,
    onNavigateToRent: () -> Unit,
    onNavigateToInsights: () -> Unit,
    viewModel: SplitViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToAddExpense,
                containerColor = Color.Transparent,
                contentColor = Color.Black,
                shape = CircleShape,
                modifier = Modifier.size(64.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            brush = Brush.linearGradient(
                                colors = listOf(Primary, Secondary)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text("+", style = MaterialTheme.typography.headlineLarge)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp)
        ) {
            Spacer(modifier = Modifier.height(48.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TITAN / VAULT",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = MaterialTheme.colorScheme.secondary,
                        fontWeight = FontWeight.Bold
                    )
                )
                
                AnimatedVisibility(visible = uiState.isSyncing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                TextButton(onClick = onNavigateToGroups) {
                    Text("Groups", style = MaterialTheme.typography.labelSmall)
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            HeroBalance(
                label = "TOTAL BALANCE",
                amount = uiState.totalOwed - uiState.totalOwe,
                caption = "You are owed ₹${uiState.totalOwed} by ${uiState.summaryInsights?.peopleWhoOweCount ?: 0} people"
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("PEOPLE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceSecondary)
                TextButton(onClick = onNavigateToHistory) {
                    Text("History →", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            LazyColumn(modifier = Modifier.weight(1f)) {
                item {
                    Text("INDIA LAYER", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        FeatureIcon("SMS", onNavigateToSms)
                        FeatureIcon("CASH", onNavigateToCash)
                        FeatureIcon("EMI", onNavigateToEmi)
                        FeatureIcon("RENT", onNavigateToRent)
                        FeatureIcon("IDEA", onNavigateToInsights)
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                }

                items(uiState.balances) { balance ->
                    PersonGlassItem(
                        balance = balance,
                        onClick = { onNavigateToPersonDetail(balance.personId) }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
fun FeatureIcon(label: String, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        Surface(
            modifier = Modifier.size(56.dp),
            color = MaterialTheme.colorScheme.surfaceContainer,
            shape = CircleShape
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(label.take(1), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceSecondary)
    }
}

@Composable
fun PersonGlassItem(balance: com.titan.app.domain.usecase.PersonBalance, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
        shape = RoundedCornerShape(20.dp)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(balance.personId, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
            val color = if (balance.amount >= 0) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.error
            val prefix = if (balance.amount >= 0) "+" else "-"
            Text("$prefix ₹${kotlin.math.abs(balance.amount)}", color = color, style = MaterialTheme.typography.titleMedium)
        }
    }
}
