package com.titan.app.features.insights

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.titan.app.domain.usecase.FinancialHealthStatus

@Composable
fun SpendingPatternsScreen(
    onBack: () -> Unit,
    viewModel: InsightsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("SPENDING / PATTERNS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Spacer(modifier = Modifier.height(32.dp))
        
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(uiState.trends) { trend ->
                Surface(
                    color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(trend.timeLabel, style = MaterialTheme.typography.labelSmall)
                        Text("₹${trend.totalAmount.toInt()}", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = (trend.splitShare / trend.totalAmount).toFloat().coerceIn(0f, 1f),
                            modifier = Modifier.fillMaxWidth(),
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                        Text("Split Share: ${((trend.splitShare / trend.totalAmount) * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
fun TriggersScreen(
    onBack: () -> Unit,
    viewModel: InsightsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("BEHAVIORAL / TRIGGERS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Spacer(modifier = Modifier.height(32.dp))
        
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(uiState.triggers) { trigger ->
                Surface(
                    color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(trigger.title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                            Text(trigger.impact, color = if(trigger.impact == "Risky") MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(trigger.description, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
fun FinancialHealthScreen(
    onBack: () -> Unit,
    viewModel: InsightsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val health = uiState.healthScore ?: return

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("FINANCIAL / HEALTH", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Spacer(modifier = Modifier.height(64.dp))
        
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = androidx.compose.ui.Alignment.Center) {
            CircularProgressIndicator(
                progress = health.score / 100f,
                modifier = Modifier.size(240.dp),
                strokeWidth = 24.dp,
                color = when(health.status) {
                    FinancialHealthStatus.GOOD -> MaterialTheme.colorScheme.tertiary
                    else -> MaterialTheme.colorScheme.error
                }
            )
            Text("${health.score}%", style = MaterialTheme.typography.displayLarge)
        }
        
        Spacer(modifier = Modifier.height(48.dp))
        
        Text(health.status.name, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = when(health.status) {
            FinancialHealthStatus.GOOD -> MaterialTheme.colorScheme.tertiary
            else -> MaterialTheme.colorScheme.error
        })
        Spacer(modifier = Modifier.height(8.dp))
        Text(health.recommendation, style = MaterialTheme.typography.bodyLarge)
    }
}
