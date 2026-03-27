package com.titan.app.domain.usecase

import com.titan.app.data.local.dao.EmiDao
import com.titan.app.data.local.entity.EmiEntity
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject

/**
 * Use case for managing EMIs.
 */
class ManageEmiUseCase @Inject constructor(
    private val emiDao: EmiDao
) {
    fun getAllEmis(): Flow<List<EmiEntity>> = emiDao.getAllEmis()

    suspend fun addEmi(name: String, amount: Double, dueDate: Long) {
        emiDao.insertEmi(
            EmiEntity(
                id = UUID.randomUUID().toString(),
                name = name,
                amount = amount,
                dueDate = dueDate
            )
        )
    }
}
