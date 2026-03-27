package com.titan.app.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module for general application-level dependencies.
 */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    // Add application-level providers here
}
