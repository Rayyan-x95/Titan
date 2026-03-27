package com.titan.app.features.split

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.titan.app.domain.model.Split

@Composable
fun SettlementScreen(
    onBack: () -> Unit,
    splitId: String,
    viewModel: SplitViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val split = uiState.allHistory.find { it.id == splitId }
    
    var amountText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        Text("RECORD PAYMENT", style = MaterialTheme.typography.labelSmall)
        
        if (split != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(split.description, style = MaterialTheme.typography.headlineSmall)
            Text("Total Owed: ₹${split.amount / split.participants.size}", style = MaterialTheme.typography.bodyLarge)
            Text("Already Settled: ₹${split.settledAmount}", style = MaterialTheme.typography.bodyMedium)
            
            Spacer(modifier = Modifier.height(32.dp))
            
            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it },
                label = { Text("Payment Amount") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = {
                    val amt = amountText.toDoubleOrNull() ?: 0.0
                    if (amt > 0) {
                        viewModel.settlePartial(split, amt)
                        onBack()
                    }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Text("Confirm Partial Payment")
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedButton(
                onClick = {
                    viewModel.settleFull(split)
                    onBack()
                },
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Text("Mark as Fully Settled")
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
            Text("Cancel")
        }
    }
}
