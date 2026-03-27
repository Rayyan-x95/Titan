package com.titan.app.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.titan.app.data.local.dao.TransactionDao
import com.titan.app.data.local.entity.TransactionEntity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

/**
 * Receiver for incoming SMS to detect financial transactions.
 */
@AndroidEntryPoint
class SmsReceiver : BroadcastReceiver() {

    @Inject lateinit var smsParser: SmsParser
    @Inject lateinit var transactionDao: TransactionDao

    private val scope = CoroutineScope(Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (sms in messages) {
                val body = sms.displayMessageBody
                val parsed = smsParser.parse(body)
                
                if (parsed != null) {
                    scope.launch {
                        transactionDao.insertTransaction(
                            TransactionEntity(
                                id = UUID.randomUUID().toString(),
                                amount = parsed.amount,
                                type = parsed.type,
                                merchant = parsed.merchant,
                                timestamp = System.currentTimeMillis()
                            )
                        )
                    }
                }
            }
        }
    }
}
