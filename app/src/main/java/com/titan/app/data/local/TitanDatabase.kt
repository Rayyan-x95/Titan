package com.titan.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.titan.app.data.local.dao.PersonDao
import com.titan.app.data.local.dao.SplitDao
import com.titan.app.data.local.entity.PersonEntity
import com.titan.app.data.local.entity.SplitEntity

/**
 * The main Room database for the Titan app.
 */
@Database(entities = [PersonEntity::class, SplitEntity::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class TitanDatabase : RoomDatabase() {
    abstract fun personDao(): PersonDao
    abstract fun splitDao(): SplitDao
}
