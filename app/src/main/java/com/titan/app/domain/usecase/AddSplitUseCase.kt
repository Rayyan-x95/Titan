package com.titan.app.domain.usecase

import com.titan.app.domain.model.Person
import com.titan.app.domain.model.Split
import com.titan.app.domain.repository.SplitRepository
import javax.inject.Inject

/**
 * Use case for adding a new split expense.
 * Automatically adds participants to the person database if they don't exist.
 */
class AddSplitUseCase @Inject constructor(
    private val repository: SplitRepository
) {
    suspend operator fun invoke(split: Split) {
        // Ensure all participants and the payer exist in the person database
        val allInvolved = (split.participants + split.paidBy).distinct()
        allInvolved.forEach { personId ->
            if (repository.getPersonById(personId) == null) {
                repository.addPerson(Person(id = personId, name = personId))
            }
        }
        repository.addSplit(split)
    }
}
