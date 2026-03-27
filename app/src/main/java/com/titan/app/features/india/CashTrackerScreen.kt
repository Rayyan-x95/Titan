package com.ninety5.titan.features.india

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
import com.ninety5.titan.core.designsystem.components.GlassCard

@Composable
fun CashTrackerScreen(
    onBack: () -> Unit,
    viewModel: IndiaLayerViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var amount by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("CASH / BALANCE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Text("₹${uiState.cashBalance}", style = MaterialTheme.typography.displayLarge)
        
        Spacer(modifier = Modifier.height(32.dp))
        
        OutlinedTextField(
            value = amount,
            onValueChange = { amount = it },
            label = { Text("Amount") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            Button(onClick = { 
                viewModel.addCashEntry(amount.toDoubleOrNull() ?: 0.0, "IN")
                amount = ""
            }, modifier = Modifier.weight(1f)) { Text("Cash In") }
            Spacer(modifier = Modifier.width(8.dp))
            Button(onClick = { 
                viewModel.addCashEntry(amount.toDoubleOrNull() ?: 0.0, "OUT")
                amount = ""
            }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("Cash Out") }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        Text("HISTORY", style = MaterialTheme.typography.labelSmall)
        Spacer(modifier = Modifier.height(16.dp))
        
        LazyColumn {
            items(uiState.cashEntries) { entry ->
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (entry.type == "IN") "Received" else "Spent", style = MaterialTheme.typography.bodyLarge)
                    Text(
                        "${if (entry.type == "IN") "+" else "-"}₹${entry.amount}",
                        color = if (entry.type == "IN") MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
