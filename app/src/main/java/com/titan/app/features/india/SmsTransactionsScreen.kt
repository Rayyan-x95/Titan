package com.titan.app.features.india

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.titan.app.core.designsystem.components.GlassCard
import com.titan.app.core.designsystem.components.GradientButton
import com.titan.app.data.local.entity.TransactionEntity

@Composable
fun SmsTransactionsScreen(
    onBack: () -> Unit,
    viewModel: IndiaLayerViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("DETECTED / SMS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Spacer(modifier = Modifier.height(16.dp))
        
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(uiState.transactions.filter { !it.isApproved }) { tx ->
                TransactionApprovalItem(
                    tx = tx,
                    onApprove = { viewModel.approveTransaction(tx) },
                    onDelete = { viewModel.deleteTransaction(tx.id) }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
fun TransactionApprovalItem(tx: TransactionEntity, onApprove: () -> Unit, onDelete: () -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(tx.merchant, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                Text("₹${tx.amount}", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.tertiary)
            }
            Text(tx.type, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceSecondary)
            Spacer(modifier = Modifier.height(16.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                Button(onClick = onApprove, modifier = Modifier.weight(1f)) { Text("Approve") }
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedButton(onClick = onDelete, modifier = Modifier.weight(1f)) { Text("Ignore") }
            }
        }
    }
}
