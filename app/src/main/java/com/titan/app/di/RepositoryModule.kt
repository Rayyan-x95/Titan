package com.titan.app.di

import com.titan.app.data.repository.SplitRepositoryImpl
import com.titan.app.domain.repository.SplitRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindSplitRepository(
        splitRepositoryImpl: SplitRepositoryImpl
    ): SplitRepository

    @Binds
    @Singleton
    abstract fun bindGroupRepository(
        groupRepositoryImpl: GroupRepositoryImpl
    ): GroupRepository
    
    // Note: TransactionRepositoryImpl is already @Singleton and injected. 
    // If we want an interface:
}
