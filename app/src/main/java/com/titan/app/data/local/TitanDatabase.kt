package com.titan.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.titan.app.data.local.dao.PersonDao
import com.titan.app.data.local.dao.SplitDao
import com.titan.app.data.local.dao.GroupDao
import com.titan.app.data.local.entity.PersonEntity
import com.titan.app.data.local.entity.SplitEntity
import com.titan.app.data.local.entity.GroupEntity

/**
 * Main database class for the Titan app.
 */
@Database(
    entities = [
        PersonEntity::class, 
        SplitEntity::class,
        GroupEntity::class
    ], 
    version = 2, // Incremented for groupId update
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class TitanDatabase : RoomDatabase() {
    abstract fun personDao(): PersonDao
    abstract fun splitDao(): SplitDao
    abstract fun groupDao(): GroupDao
}
