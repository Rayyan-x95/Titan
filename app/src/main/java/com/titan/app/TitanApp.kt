package com.ninety5.titan

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Main application class for Titan.
 * Annotated with @HiltAndroidApp to trigger Hilt's code generation.
 */
@HiltAndroidApp
class TitanApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Firebase and other initializations will happen here if needed
    }
}
