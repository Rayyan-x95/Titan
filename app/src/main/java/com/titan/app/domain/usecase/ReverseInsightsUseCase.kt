package com.ninety5.titan.domain.usecase

import javax.inject.Inject

data class ReverseInsight(
    val amount: Double,
    val valueInContext: String,
    val emoji: String
)

/**
 * Maps monetary values to relatable context (e.g., money = number of meals).
 * Makes financial data feel more contextual and human.
 */
class ReverseInsightsUseCase @Inject constructor() {
    
    fun map(amount: Double): ReverseInsight {
        return when {
            amount < 500 -> ReverseInsight(amount, "1-2 Movie Tickets", "🎟️")
            amount < 1500 -> ReverseInsight(amount, "3 Full Meals", "🍱")
            amount < 5000 -> ReverseInsight(amount, "1 Weekend Roadtrip (Fuel)", "🚗")
            else -> ReverseInsight(amount, "Half a Smartphone EMI", "📱")
        }
    }
}
