package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.model.Split
import com.ninety5.titan.domain.repository.SplitRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/**
 * Use case for fetching all splits involving a specific person.
 */
class GetSplitsByPersonUseCase @Inject constructor(
    private val repository: SplitRepository
) {
    operator fun invoke(personId: String, currentUser: String): Flow<List<Split>> {
        return repository.getAllSplits().map { allSplits ->
            allSplits.filter { split ->
                (split.paidBy == personId && split.participants.contains(currentUser)) ||
                (split.paidBy == currentUser && split.participants.contains(personId))
            }
        }
    }
}
