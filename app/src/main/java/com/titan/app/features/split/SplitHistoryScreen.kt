package com.ninety5.titan.features.split

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ninety5.titan.domain.model.Split
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun SplitHistoryScreen(
    onBack: () -> Unit,
    viewModel: SplitViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp)
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        TextButton(onClick = onBack) {
            Text("← Back", color = MaterialTheme.colorScheme.primary)
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Global History",
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        LazyColumn(modifier = Modifier.fillMaxSize()) {
            items(uiState.allHistory) { split ->
                HistoryItem(split)
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
fun HistoryItem(split: Split) {
    val sdf = SimpleDateFormat("dd MMM, yyyy", Locale.getDefault())
    Surface(
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(split.description.ifEmpty { "Expense" }, style = MaterialTheme.typography.bodyLarge)
                Text(sdf.format(Date(split.createdAt)), style = MaterialTheme.typography.labelSmall)
            }
            Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                Text("₹${split.amount}", style = MaterialTheme.typography.titleMedium)
                val status = if (split.isSettled) "Settled" else if (split.settledAmount > 0) "Partial" else "Pending"
                val color = if (split.isSettled) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.secondary
                Text(status, style = MaterialTheme.typography.labelSmall, color = color)
            }
        }
    }
}
