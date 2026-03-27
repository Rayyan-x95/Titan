package com.titan.app.features.group

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

@Composable
fun GroupDetailScreen(
    groupId: String,
    onBack: () -> Unit,
    onNavigateToAddExpense: (String) -> Unit,
    viewModel: GroupViewModel = hiltViewModel()
) {
    val detailState by viewModel.detailState.collectAsState()

    LaunchedEffect(groupId) {
        viewModel.loadGroupDetail(groupId)
    }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        
        detailState.group?.let { group ->
            Spacer(modifier = Modifier.height(24.dp))
            Text(group.name.uppercase(), style = MaterialTheme.typography.headlineLarge)
            Text("${group.members.size} members", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Text("SETTLEMENT ROADMAP", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceSecondary)
            Spacer(modifier = Modifier.height(16.dp))
            
            if (detailState.optimizedPayments.isEmpty()) {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text("Everything is settled! 🙌", style = MaterialTheme.typography.bodyMedium)
                }
            } else {
                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(detailState.optimizedPayments) { payment ->
                        SettlementRoadmapItem(payment)
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = { onNavigateToAddExpense(groupId) },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("ADD GROUP EXPENSE")
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun SettlementRoadmapItem(payment: com.titan.app.domain.usecase.OptimizedPayment) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text("${payment.from} pays", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceSecondary)
                Text(payment.to, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
            }
            Text("₹${payment.amount}", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.tertiary)
        }
    }
}
