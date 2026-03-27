package com.titan.app.features.india

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.titan.app.core.designsystem.components.GradientButton

@Composable
fun RentSplitScreen(
    onBack: () -> Unit,
    viewModel: IndiaLayerViewModel = hiltViewModel()
) {
    var amount by remember { mutableStateOf("") }
    var members by remember { mutableStateOf("") }
    var isRecurring by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← BACK", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("RENT / MONTHLY SPLIT", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(text = "MONTHLY RENT AMOUNT", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center, style = MaterialTheme.typography.labelSmall)
        TextField(
            value = amount,
            onValueChange = { amount = it },
            placeholder = { Text("₹0", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.displayMedium.copy(textAlign = TextAlign.Center),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
                unfocusedContainerColor = androidx.compose.ui.graphics.Color.Transparent
            )
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        OutlinedTextField(
            value = members,
            onValueChange = { members = it },
            label = { Text("Members (comma separated)") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
            Checkbox(checked = isRecurring, onCheckedChange = { isRecurring = it })
            Text("Auto-generate split every month", style = MaterialTheme.typography.bodyMedium)
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        GradientButton(
            text = "SETUP RENT SPLIT",
            onClick = {
                val amountVal = amount.toDoubleOrNull() ?: 0.0
                val membersList = members.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                if (amountVal > 0 && membersList.isNotEmpty()) {
                    viewModel.triggerRentSplit(amountVal, membersList)
                    onBack()
                }
            }
        )
        Spacer(modifier = Modifier.height(24.dp))
    }
}
