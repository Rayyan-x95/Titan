package com.ninety5.titan.services

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthService @Inject constructor(
    private val auth: FirebaseAuth
) {
    suspend fun signInAnonymously(): String? {
        return try {
            val result = auth.signInAnonymously().await()
            result.user?.uid
        } catch (e: Exception) {
            null
        }
    }

    fun getUserId(): String? = auth.currentUser?.uid
}
