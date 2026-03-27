package com.ninety5.titan.features.split.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ninety5.titan.domain.model.Person

@Composable
fun QuickAddPanel(
    people: List<Person>,
    isVisible: Boolean,
    onDismiss: () -> Unit,
    onAdd: (Double, List<String>) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    val selectedPeople = remember { mutableStateListOf<String>() }

    AnimatedVisibility(
        visible = isVisible,
        enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(28.dp),
            color = MaterialTheme.colorScheme.surfaceContainerHigh,
            tonalElevation = 8.dp
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("QUICK ADD", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.height(16.dp))
                
                TextField(
                    value = amount,
                    onValueChange = { amount = it },
                    placeholder = { Text("₹0", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = MaterialTheme.typography.headlineLarge,
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent
                    )
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                LazyRow {
                    items(people) { person ->
                        val isSelected = selectedPeople.any { it == person.id }
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                if (isSelected) selectedPeople.removeAll { it == person.id }
                                else selectedPeople.add(person.id)
                            },
                            label = { Text(person.name) },
                            modifier = Modifier.padding(end = 8.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("CANCEL") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val amountVal = amount.toDoubleOrNull() ?: 0.0
                            if (amountVal > 0 && selectedPeople.isNotEmpty()) {
                                onAdd(amountVal, selectedPeople.toList())
                                onDismiss()
                            }
                        },
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text("SAVE INSTANTLY")
                    }
                }
            }
        }
    }
}
