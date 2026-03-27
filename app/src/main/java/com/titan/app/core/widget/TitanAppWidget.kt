package com.ninety5.titan.core.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.*
import androidx.glance.action.actionStartActivity
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.*
import androidx.glance.text.*
import androidx.glance.unit.ColorProvider
import com.ninety5.titan.MainActivity

class TitanAppWidget : GlanceAppWidget() {
    override suspend fun provideContent(context: Context, id: GlanceId) {
        provideContent {
            TitanWidgetContent()
        }
    }

    @Composable
    private fun TitanWidgetContent() {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(androidx.compose.ui.graphics.Color(0xFF0A0E19)))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "TITAN / VAULT",
                style = TextStyle(color = ColorProvider(androidx.compose.ui.graphics.Color(0xFF00CFFC)), fontSize = 12.sp)
            )
            Spacer(modifier = GlanceModifier.height(8.dp))
            Text(
                "You are owed",
                style = TextStyle(color = ColorProvider(androidx.compose.ui.graphics.Color.White), fontSize = 14.sp)
            )
            Text(
                "₹2,450",
                style = TextStyle(color = ColorProvider(androidx.compose.ui.graphics.Color.White), fontSize = 24.sp, fontWeight = FontWeight.Bold)
            )
            Spacer(modifier = GlanceModifier.height(16.dp))
            Button(
                text = "QUICK ADD",
                onClick = actionStartActivity<MainActivity>()
            )
        }
    }
}
