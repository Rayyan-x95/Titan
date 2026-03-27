package com.titan.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.titan.app.data.local.dao.*
import com.titan.app.data.local.entity.*

/**
 * Main database class for the Titan app.
 */
@Database(
    entities = [
        PersonEntity::class, 
        SplitEntity::class,
        GroupEntity::class,
        TransactionEntity::class,
        EmiEntity::class,
        CashEntryEntity::class
    ], 
    version = 3, // Incremented for India Layer entities
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class TitanDatabase : RoomDatabase() {
    abstract fun personDao(): PersonDao
    abstract fun splitDao(): SplitDao
    abstract fun groupDao(): GroupDao
    abstract fun transactionDao(): TransactionDao
    abstract fun emiDao(): EmiDao
    abstract fun cashDao(): CashDao
}
