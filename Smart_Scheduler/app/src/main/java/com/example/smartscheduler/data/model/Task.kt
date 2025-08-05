package com.example.smartscheduler.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDateTime

@Entity(tableName = "tasks")
data class Task(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val description: String = "",
    val dueDate: LocalDateTime,
    val priority: Priority = Priority.MEDIUM,
    val isCompleted: Boolean = false,
    val category: String = "",
    val status: TaskStatus = TaskStatus.TODO,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class Priority {
    LOW, MEDIUM, HIGH, URGENT
} 