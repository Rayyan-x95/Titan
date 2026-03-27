package com.titan.app.features.india

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

@Composable
fun EmiTrackerScreen(
    onBack: () -> Unit,
    viewModel: IndiaLayerViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var name by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("EMI / TRACKER", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("EMI Name (e.g. iPhone)") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = amount, onValueChange = { amount = it }, label = { Text("Amount Monthly") }, modifier = Modifier.fillMaxWidth())
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = {
            viewModel.addEmi(name, amount.toDoubleOrNull() ?: 0.0, System.currentTimeMillis())
            name = ""
            amount = ""
        }, modifier = Modifier.fillMaxWidth()) { Text("Add EMI") }
        
        Spacer(modifier = Modifier.height(32.dp))
        Text("ACTIVE EMIS", style = MaterialTheme.typography.labelSmall)
        Spacer(modifier = Modifier.height(16.dp))
        
        LazyColumn {
            items(uiState.emis) { emi ->
                Surface(
                    color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(emi.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                        Text("₹${emi.amount}", color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}
