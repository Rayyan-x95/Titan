package com.ninety5.titan.features.split

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ninety5.titan.core.designsystem.components.GradientButton

@Composable
fun AddExpenseScreen(
    onBack: () -> Unit,
    initialGroupId: String? = null,
    viewModel: SplitViewModel = hiltViewModel()
) {
    var amount by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var participants by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        TextButton(onClick = onBack) {
            Text("← CANCEL", color = MaterialTheme.colorScheme.onSurfaceSecondary)
        }
        
        Spacer(modifier = Modifier.height(48.dp))
        
        Text(
            text = "HOW MUCH?",
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.secondary
        )
        
        TextField(
            value = amount,
            onValueChange = { amount = it },
            placeholder = { Text("0", color = MaterialTheme.colorScheme.onSurfaceSecondary.copy(alpha = 0.3f)) },
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.displayLarge.copy(textAlign = TextAlign.Center),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            )
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                TextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = { Text("For what?") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    )
                )
                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                TextField(
                    value = participants,
                    onValueChange = { participants = it },
                    placeholder = { Text("With who? (names, comma separated)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    )
                )
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        GradientButton(
            text = if (initialGroupId != null) "SPLIT IN GROUP" else "SPLIT EXPENSE",
            onClick = {
                val amountVal = amount.toDoubleOrNull() ?: 0.0
                val participantsList = participants.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                if (amountVal > 0 && participantsList.isNotEmpty()) {
                    viewModel.addSplit(amountVal, description, participantsList, initialGroupId)
                    onBack()
                }
            }
        )
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}
