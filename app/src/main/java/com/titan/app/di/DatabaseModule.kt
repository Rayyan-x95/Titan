package com.titan.app.di

import android.content.Context
import androidx.room.Room
import com.titan.app.data.local.TitanDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module for database-related dependencies.
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): TitanDatabase {
        return Room.databaseBuilder(
            context,
            TitanDatabase::class.java,
            "titan_database"
        ).build()
    }

    @Provides
    fun providePersonDao(db: TitanDatabase) = db.personDao()

    @Provides
    fun provideSplitDao(db: TitanDatabase) = db.splitDao()
}
