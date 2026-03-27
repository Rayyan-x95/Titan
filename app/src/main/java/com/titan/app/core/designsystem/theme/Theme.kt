package com.titan.app.core.designsystem.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Primary,
    onPrimary = Color.Black,
    secondary = Secondary,
    onSecondary = Color.Black,
    tertiary = Tertiary,
    onTertiary = Color.Black,
    background = Background,
    onBackground = OnSurface,
    surface = SurfaceContainer,
    onSurface = OnSurface,
    surfaceContainer = SurfaceContainer,
    surfaceContainerLow = SurfaceContainerLow,
    error = Error
)

@Composable
fun TitanTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
