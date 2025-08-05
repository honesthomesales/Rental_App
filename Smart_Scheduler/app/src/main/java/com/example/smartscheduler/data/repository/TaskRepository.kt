package com.example.smartscheduler.data.repository

import com.example.smartscheduler.data.local.TaskDao
import com.example.smartscheduler.data.model.Task
import com.example.smartscheduler.data.model.TaskStatus
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

interface TaskRepository {
    fun getAllTasks(): Flow<List<Task>>
    fun getActiveTasks(): Flow<List<Task>>
    fun getCompletedTasks(): Flow<List<Task>>
    fun getTasksByStatus(status: TaskStatus): Flow<List<Task>>
    suspend fun getTaskById(taskId: Long): Task?
    suspend fun insertTask(task: Task): Long
    suspend fun updateTask(task: Task)
    suspend fun deleteTask(task: Task)
    suspend fun deleteCompletedTasks()
    fun getTasksByDateRange(startDate: String, endDate: String): Flow<List<Task>>
    fun getTasksByCategory(category: String): Flow<List<Task>>
}

class TaskRepositoryImpl @Inject constructor(
    private val taskDao: TaskDao
) : TaskRepository {
    override fun getAllTasks(): Flow<List<Task>> = taskDao.getAllTasks()
    
    override fun getActiveTasks(): Flow<List<Task>> = taskDao.getActiveTasks()
    
    override fun getCompletedTasks(): Flow<List<Task>> = taskDao.getCompletedTasks()
    
    override fun getTasksByStatus(status: TaskStatus): Flow<List<Task>> = taskDao.getTasksByStatus(status)
    
    override suspend fun getTaskById(taskId: Long): Task? = taskDao.getTaskById(taskId)
    
    override suspend fun insertTask(task: Task): Long = taskDao.insertTask(task)
    
    override suspend fun updateTask(task: Task) = taskDao.updateTask(task)
    
    override suspend fun deleteTask(task: Task) = taskDao.deleteTask(task)
    
    override suspend fun deleteCompletedTasks() = taskDao.deleteCompletedTasks()
    
    override fun getTasksByDateRange(startDate: String, endDate: String): Flow<List<Task>> = 
        taskDao.getTasksByDateRange(startDate, endDate)
    
    override fun getTasksByCategory(category: String): Flow<List<Task>> = 
        taskDao.getTasksByCategory(category)
} 