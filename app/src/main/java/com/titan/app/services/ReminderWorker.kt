package com.titan.app.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.titan.app.domain.repository.SplitRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.first

/**
 * Worker that runs daily to check for pending splits and notify the user.
 */
@HiltWorker
class ReminderWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: SplitRepository
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val splits = repository.getAllSplits().first()
        val pendingSplits = splits.filter { !it.isSettled && it.paidBy == "Me" }
        
        val twoDaysAgo = System.currentTimeMillis() - (2 * 24 * 60 * 60 * 1000)
        val overdueSplits = pendingSplits.filter { it.createdAt < twoDaysAgo }

        if (overdueSplits.isNotEmpty()) {
            val totalOwed = overdueSplits.sumOf { (it.amount / it.participants.size) * (it.participants.size - 1) - it.settledAmount }
            if (totalOwed > 0) {
                showNotification(applicationContext, "You are owed ₹$totalOwed from ${overdueSplits.size} splits.")
            }
        }

        return Result.success()
    }

    private fun showNotification(context: Context, message: String) {
        val channelId = "titan_reminders"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Titan Reminders", NotificationManager.IMPORTANCE_DEFAULT)
            notificationManager.createNotificationChannel(channel)
        }

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Titan Split Reminder")
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        notificationManager.notify(1, notification)
    }
}
