package com.ninety5.titan

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.ninety5.titan.core.designsystem.theme.TitanTheme
import com.ninety5.titan.core.navigation.NavGraph
import dagger.hilt.android.AndroidEntryPoint

/**
 * Main Activity of the Titan app.
 * Serves as the entry point for the UI and hosts the Navigation Graph.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TitanTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    NavGraph()
                }
            }
        }
    }
}
