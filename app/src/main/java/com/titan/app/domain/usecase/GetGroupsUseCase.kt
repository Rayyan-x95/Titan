package com.titan.app.domain.usecase

import com.titan.app.domain.model.Group
import com.titan.app.domain.repository.GroupRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Use case for fetching all available groups.
 */
class GetGroupsUseCase @Inject constructor(
    private val repository: GroupRepository
) {
    operator fun invoke(): Flow<List<Group>> = repository.getAllGroups()
}
