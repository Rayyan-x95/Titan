package com.titan.app.features.split

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.titan.app.domain.model.Split
import java.net.URLEncoder

@Composable
fun PersonDetailScreen(
    onBack: () -> Unit,
    onNavigateToSettlement: (String) -> Unit,
    viewModel: PersonDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

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
            text = uiState.personId.uppercase(),
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        val color = if (uiState.balance >= 0) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.error
        Text(
            text = if (uiState.balance >= 0) "Owes you ₹${uiState.balance}" else "You owe ₹${kotlin.math.abs(uiState.balance)}",
            style = MaterialTheme.typography.titleLarge,
            color = color
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = {
                val message = "Hey, just a reminder for ₹${kotlin.math.abs(uiState.balance)} from Titan App 🙌"
                sendWhatsAppReminder(context, message)
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Send WhatsApp Reminder")
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text("TRANSACTION HISTORY", style = MaterialTheme.typography.labelSmall)
        
        Spacer(modifier = Modifier.height(16.dp))
        
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(uiState.transactions) { split ->
                TransactionItem(
                    split = split, 
                    onClick = { if (!split.isSettled) onNavigateToSettlement(split.id) }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
    }
}

@Composable
fun TransactionItem(split: Split, onClick: () -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceContainerLow,
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth().clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(split.description.ifEmpty { "Expense" }, style = MaterialTheme.typography.bodyLarge)
                val status = if (split.isSettled) "Settled" else if (split.settledAmount > 0) "Partial (₹${split.settledAmount} paid)" else "Pending"
                Text(status, style = MaterialTheme.typography.labelSmall, color = if (split.isSettled) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.secondary)
            }
            val perPerson = split.amount / split.participants.size
            Text("₹$perPerson", style = MaterialTheme.typography.titleMedium)
        }
    }
}

private fun sendWhatsAppReminder(context: Context, message: String) {
    try {
        val intent = Intent(Intent.ACTION_VIEW)
        val url = "https://api.whatsapp.com/send?text=" + URLEncoder.encode(message, "UTF-8")
        intent.data = Uri.parse(url)
        context.startActivity(intent)
    } catch (e: Exception) {
        // Fallback or Toast
    }
}
