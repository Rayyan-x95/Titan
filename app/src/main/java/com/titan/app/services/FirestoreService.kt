package com.ninety5.titan.services

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreService @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend fun <T : Any> saveData(collection: String, documentId: String, data: T) {
        firestore.collection(collection).document(documentId).set(data).await()
    }

    suspend fun getDocument(collection: String, documentId: String) =
        firestore.collection(collection).document(documentId).get().await()

    suspend fun getAllDocuments(collection: String, userId: String) =
        firestore.collection("users").document(userId).collection(collection).get().await()

    suspend fun saveUserData(userId: String, collection: String, documentId: String, data: Map<String, Any>) {
        firestore.collection("users")
            .document(userId)
            .collection(collection)
            .document(documentId)
            .set(data)
            .await()
    }
}
