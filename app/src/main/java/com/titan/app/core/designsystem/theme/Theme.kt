package com.titan.app.core.designsystem.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = Primary,
    onPrimary = Background,
    primaryContainer = PrimaryDim,
    onPrimaryContainer = OnSurface,
    
    secondary = Secondary,
    onSecondary = Background,
    
    tertiary = Tertiary,
    onTertiary = Background,
    
    background = Background,
    onBackground = OnSurface,
    
    surface = SurfaceLevel0,
    onSurface = OnSurface,
    surfaceVariant = SurfaceLevel1,
    onSurfaceVariant = OnSurfaceVariant,
    
    surfaceContainerLow = SurfaceLevel1,
    surfaceContainer = SurfaceLevel2,
    surfaceContainerHigh = SurfaceLevel3
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
