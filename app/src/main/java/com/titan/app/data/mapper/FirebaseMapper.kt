package com.ninety5.titan.data.mapper

import com.ninety5.titan.data.local.entity.PersonEntity
import com.ninety5.titan.data.local.entity.SplitEntity

/**
 * Maps between Room Entities and Firestore-compatible Maps.
 */
object FirebaseMapper {

    fun SplitEntity.toFirebaseMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "amount" to amount,
            "description" to description,
            "paidBy" to paidBy,
            "participants" to participants,
            "createdAt" to createdAt,
            "isSettled" to isSettled,
            "settledAmount" to settledAmount,
            "updatedAt" to updatedAt
        )
    }

    fun Map<String, Any>.toSplitEntity(): SplitEntity {
        return SplitEntity(
            id = this["id"] as String,
            amount = (this["amount"] as? Number)?.toDouble() ?: 0.0,
            description = this["description"] as? String ?: "",
            paidBy = this["paidBy"] as? String ?: "",
            participants = (this["participants"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
            createdAt = (this["createdAt"] as? Number)?.toLong() ?: 0L,
            isSettled = this["isSettled"] as? Boolean ?: false,
            settledAmount = (this["settledAmount"] as? Number)?.toDouble() ?: 0.0,
            updatedAt = (this["updatedAt"] as? Number)?.toLong() ?: 0L
        )
    }

    fun PersonEntity.toFirebaseMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "name" to name
        )
    }

    fun Map<String, Any>.toPersonEntity(): PersonEntity {
        return PersonEntity(
            id = this["id"] as String,
            name = this["name"] as? String ?: ""
        )
    }

    fun GroupEntity.toFirebaseMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "name" to name,
            "members" to members,
            "createdAt" to createdAt
        )
    }

    fun Map<String, Any>.toGroupEntity(): GroupEntity {
        return GroupEntity(
            id = this["id"] as String,
            name = this["name"] as? String ?: "",
            members = (this["members"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
            createdAt = (this["createdAt"] as? Number)?.toLong() ?: 0L
        )
    }
}
