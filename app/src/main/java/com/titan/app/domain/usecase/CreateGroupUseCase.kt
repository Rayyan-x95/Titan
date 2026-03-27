package com.titan.app.domain.usecase

import com.titan.app.domain.model.Group
import com.titan.app.domain.model.Person
import com.titan.app.domain.repository.GroupRepository
import com.titan.app.domain.repository.SplitRepository
import java.util.UUID
import javax.inject.Inject

/**
 * Use case for creating a new expense group.
 * Ensures all members exist in the person database.
 */
class CreateGroupUseCase @Inject constructor(
    private val groupRepository: GroupRepository,
    private val splitRepository: SplitRepository
) {
    suspend operator fun invoke(name: String, memberNames: List<String>) {
        val members = memberNames.map { it.trim() }.filter { it.isNotEmpty() }
        
        // Ensure people exist
        members.forEach { name ->
            if (splitRepository.getPersonById(name) == null) {
                splitRepository.addPerson(Person(id = name, name = name))
            }
        }

        val newGroup = Group(
            id = UUID.randomUUID().toString(),
            name = name,
            members = members + "Me" // Include current user
        )
        groupRepository.addGroup(newGroup)
    }
}
