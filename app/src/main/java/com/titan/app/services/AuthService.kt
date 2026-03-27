package com.titan.app.services

import com.google.firebase.auth.FirebaseAuth
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Service for Firebase Authentication operations.
 * Skeleton implementation for Phase 0.
 */
@Singleton
class AuthService @Inject constructor(
    private val firebaseAuth: FirebaseAuth
) {
    /**
     * Authenticates the user anonymously with Firebase.
     */
    fun signInAnonymously() {
        // TODO: Implementation for Phase 1
    }

    /**
     * Signs out the current user.
     */
    fun signOut() {
        // TODO: Implementation for Phase 1
    }
}
