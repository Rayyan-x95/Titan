package com.ninety5.titan.domain.usecase

import com.ninety5.titan.domain.model.Person
import com.ninety5.titan.domain.model.Split
import com.ninety5.titan.domain.repository.SplitRepository
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
