package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.model.Group
import com.ninety5.titan.domain.repository.GroupRepository
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
