package com.titan.app.features.group

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
fun AddGroupScreen(
    onBack: () -> Unit,
    viewModel: GroupViewModel = hiltViewModel()
) {
    var name by remember { mutableStateOf("") }
    var members by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        TextButton(onClick = onBack) { Text("← CANCEL", color = MaterialTheme.colorScheme.onSurfaceSecondary) }
        Spacer(modifier = Modifier.height(48.dp))
        
        Text(text = "NEW GROUP NAME", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.secondary)
        
        TextField(
            value = name,
            onValueChange = { name = it },
            placeholder = { Text("Trip to Leh..", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.headlineMedium.copy(textAlign = TextAlign.Center),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
                unfocusedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
                focusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent,
                unfocusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent
            )
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surfaceContainer.copy(alpha = 0.5f),
            shape = RoundedCornerShape(20.dp)
        ) {
            TextField(
                value = members,
                onValueChange = { members = it },
                placeholder = { Text("Add members (comma separated electronics)") },
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
                    unfocusedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
                    focusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent,
                    unfocusedIndicatorColor = androidx.compose.ui.graphics.Color.Transparent
                )
            )
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        GradientButton(
            text = "CREATE GROUP",
            onClick = {
                if (name.isNotEmpty()) {
                    viewModel.createGroup(name, members.split(",").map { it.trim() }.filter { it.isNotEmpty() })
                    onBack()
                }
            }
        )
        Spacer(modifier = Modifier.height(24.dp))
    }
}
