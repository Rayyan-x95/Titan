package com.ninety5.titan.data.sync

import com.ninety5.titan.data.local.dao.PersonDao
import com.ninety5.titan.data.local.dao.SplitDao
import com.ninety5.titan.data.mapper.FirebaseMapper.toFirebaseMap
import com.ninety5.titan.data.mapper.FirebaseMapper.toPersonEntity
import com.ninety5.titan.data.mapper.FirebaseMapper.toSplitEntity
import com.ninety5.titan.services.AuthService
import com.ninety5.titan.services.FirestoreService
import kotlinx.coroutines.flow.first
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    private val authService: AuthService,
    private val firestoreService: FirestoreService,
    private val splitDao: SplitDao,
    private val personDao: PersonDao
) {

    suspend fun sync() {
        val userId = authService.getUserId() ?: authService.signInAnonymously() ?: return
        
        // 1. Pull from Firestore
        pullFromRemote(userId)
        
        // 2. Push to Firestore
        pushToRemote(userId)
    }

    private suspend fun pullFromRemote(userId: String) {
        val remoteSplits = firestoreService.getAllDocuments("splits", userId).documents
        remoteSplits.forEach { doc ->
            val remoteSplit = doc.data?.toSplitEntity() ?: return@forEach
            val localSplit = splitDao.getAllSplits().first().find { it.id == remoteSplit.id }
            
            if (localSplit == null || remoteSplit.updatedAt > localSplit.updatedAt) {
                splitDao.insertSplit(remoteSplit)
            }
        }

        val remotePeople = firestoreService.getAllDocuments("people", userId).documents
        remotePeople.forEach { doc ->
            val remotePerson = doc.data?.toPersonEntity() ?: return@forEach
            personDao.insertPerson(remotePerson)
        }

        val remoteGroups = firestoreService.getAllDocuments("groups", userId).documents
        remoteGroups.forEach { doc ->
            val remoteGroup = doc.data?.toGroupEntity() ?: return@forEach
            groupDao.insertGroup(remoteGroup)
        }
    }

    suspend fun pushToRemote(userId: String? = null) {
        val uid = userId ?: authService.getUserId() ?: return
        
        val localSplits = splitDao.getAllSplits().first()
        localSplits.forEach { split ->
            firestoreService.saveUserData(uid, "splits", split.id, split.toFirebaseMap())
        }

        val localPeople = personDao.getAllPeople().first()
        localPeople.forEach { person ->
            firestoreService.saveUserData(uid, "people", person.id, person.toFirebaseMap())
        }

        val localGroups = groupDao.getAllGroups().first()
        localGroups.forEach { group ->
            firestoreService.saveUserData(uid, "groups", group.id, group.toFirebaseMap())
        }
    }
}
