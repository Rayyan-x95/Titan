package com.ninety5.titan.domain.usecase

import android.content.Context
import android.content.Intent
import javax.inject.Inject

class ShareSummaryUseCase @Inject constructor() {
    
    fun execute(context: Context, totalOwed: Double, totalOwe: Double, keyInsight: String) {
        val shareText = """
            📊 TITAN FINANCIAL SUMMARY
            
            💰 You are owed: ₹$totalOwed
            💸 You owe: ₹$totalOwe
            
            💡 Insight: $keyInsight
            
            ---
            Tracked via Titan ⚡
        """.trimIndent()

        val sendIntent: Intent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, shareText)
            type = "text/plain"
        }

        val shareIntent = Intent.createChooser(sendIntent, "Share Titan Summary")
        shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(shareIntent)
    }

    fun getReferralMessage(): String {
        return "\n\nSent via Titan App - Track expenses instantly ⚡"
    }
}
