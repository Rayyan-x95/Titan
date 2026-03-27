package com.ninety5.titan.di

import com.ninety5.titan.data.repository.SplitRepositoryImpl
import com.ninety5.titan.domain.repository.SplitRepository
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

    @Binds
    @Singleton
    abstract fun bindInsightsRepository(
        insightsRepositoryImpl: InsightsRepositoryImpl
    ): com.ninety5.titan.domain.repository.InsightsRepository
}
