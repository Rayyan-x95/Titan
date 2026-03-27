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
import com.titan.app.core.designsystem.components.GlassCard
import com.titan.app.domain.usecase.FinancialHealthStatus

@Composable
fun InsightsScreen(
    onBack: () -> Unit,
    onNavigateToPatterns: () -> Unit,
    onNavigateToTriggers: () -> Unit,
    onNavigateToHealth: () -> Unit,
    viewModel: InsightsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("FINANCIAL / INSIGHTS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Spacer(modifier = Modifier.height(32.dp))
        
        // Health Score Card (Preview)
        uiState.healthScore?.let { health ->
            Surface(
                color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.fillMaxWidth().clickable { onNavigateToHealth() }
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("HEALTH SCORE", style = MaterialTheme.typography.labelSmall)
                    Text("${health.score}%", style = MaterialTheme.typography.displayMedium, color = when(health.status) {
                        FinancialHealthStatus.GOOD -> MaterialTheme.colorScheme.tertiary
                        else -> MaterialTheme.colorScheme.error
                    })
                    Text(health.recommendation, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Reverse Insight Card
        uiState.reverseInsight?.let { ri ->
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("RELATIVITY", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Your ₹${ri.amount.toInt()} spent this week is roughly equal to:", style = MaterialTheme.typography.bodyMedium)
                    Row(modifier = Modifier.padding(vertical = 12.dp)) {
                        Text(ri.emoji, style = MaterialTheme.typography.headlineLarge)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(ri.valueInContext, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Quick Navigation
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Button(onClick = onNavigateToPatterns, modifier = Modifier.weight(1f)) { Text("Patterns") }
            Spacer(modifier = Modifier.width(12.dp))
            Button(onClick = onNavigateToTriggers, modifier = Modifier.weight(1f)) { Text("Triggers") }
        }
    }
}
