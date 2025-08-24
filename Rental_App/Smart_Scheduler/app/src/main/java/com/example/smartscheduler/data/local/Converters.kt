package com.example.smartscheduler.data.local

import androidx.room.TypeConverter
import com.example.smartscheduler.data.model.TaskStatus
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class Converters {
    private val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    @TypeConverter
    fun fromTimestamp(value: String?): LocalDateTime? {
        return value?.let { LocalDateTime.parse(it, formatter) }
    }

    @TypeConverter
    fun dateToTimestamp(date: LocalDateTime?): String? {
        return date?.format(formatter)
    }

    @TypeConverter
    fun fromTaskStatus(status: TaskStatus?): String? {
        return status?.name
    }

    @TypeConverter
    fun toTaskStatus(status: String?): TaskStatus? {
        return status?.let { TaskStatus.valueOf(it) }
    }
} 