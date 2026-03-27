package com.ninety5.titan.services

import java.util.regex.Pattern
import javax.inject.Inject
import javax.inject.Singleton

data class ParsedTransaction(
    val amount: Double,
    val merchant: String,
    val type: String // UPI, CARD, BANK
)

/**
 * Utility to parse Indian bank and UPI SMS messages.
 */
@Singleton
class SmsParser @Inject constructor() {

    private val amountPattern = Pattern.compile("(?i)(?:Rs\\.?|INR|amt)\\s?([\\d,]+\\.?\\d*)")
    private val vpaPattern = Pattern.compile("[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}") // Basic UPI ID regex

    fun parse(message: String): ParsedTransaction? {
        val amountMatch = amountPattern.matcher(message)
        if (!amountMatch.find()) return null
        
        val amount = amountMatch.group(1)?.replace(",", "")?.toDoubleOrNull() ?: return null
        
        val type = when {
            message.contains("UPI", ignoreCase = true) -> "UPI"
            message.contains("Debit Card", ignoreCase = true) || message.contains("Card", ignoreCase = true) -> "CARD"
            else -> "BANK"
        }

        // Simple merchant extraction (usually after 'at' or 'to')
        val merchant = when {
            message.contains(" at ", ignoreCase = true) -> message.split(Regex("(?i) at "))[1].split(" ")[0]
            message.contains(" to ", ignoreCase = true) -> message.split(Regex("(?i) to "))[1].split(" ")[0]
            else -> "Merchant"
        }

        return ParsedTransaction(amount, merchant.take(20), type)
    }
}
