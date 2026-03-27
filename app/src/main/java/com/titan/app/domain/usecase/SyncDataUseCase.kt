package com.ninety5.titan.domain.usecase

import com.ninety5.titan.data.sync.SyncManager
import javax.inject.Inject

/**
 * Use case to trigger a full data sync between Room and Firestore.
 */
class SyncDataUseCase @Inject constructor(
    private val syncManager: SyncManager
) {
    suspend operator fun invoke() {
        syncManager.sync()
    }
}
