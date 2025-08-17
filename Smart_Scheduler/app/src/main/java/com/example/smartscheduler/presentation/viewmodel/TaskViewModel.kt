package com.example.smartscheduler.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartscheduler.data.model.Priority
import com.example.smartscheduler.data.model.Task
import com.example.smartscheduler.data.model.TaskStatus
import com.example.smartscheduler.data.repository.TaskRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import javax.inject.Inject

@HiltViewModel
class TaskViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {

    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadTasks()
    }

    fun loadTasks() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                taskRepository.getAllTasks().collect { taskList ->
                    _tasks.value = taskList
                    _isLoading.value = false
                    
                    // Add sample data if the list is empty
                    if (taskList.isEmpty()) {
                        addSampleTasks()
                    }
                }
            } catch (e: Exception) {
                _error.value = e.message
                _isLoading.value = false
            }
        }
    }

    private fun addSampleTasks() {
        viewModelScope.launch {
            try {
                val sampleTasks = listOf(
                    Task(
                        title = "Complete project proposal",
                        description = "Write and submit the quarterly project proposal",
                        dueDate = LocalDateTime.now().plusDays(2),
                        priority = Priority.HIGH,
                        category = "Work",
                        status = TaskStatus.TODO
                    ),
                    Task(
                        title = "Buy groceries",
                        description = "Milk, bread, eggs, and vegetables",
                        dueDate = LocalDateTime.now().plusHours(3),
                        priority = Priority.MEDIUM,
                        category = "Personal",
                        status = TaskStatus.IN_PROGRESS
                    ),
                    Task(
                        title = "Call dentist",
                        description = "Schedule annual checkup",
                        dueDate = LocalDateTime.now().plusDays(5),
                        priority = Priority.LOW,
                        category = "Health",
                        status = TaskStatus.DONE
                    ),
                    Task(
                        title = "Prepare presentation",
                        description = "Create slides for team meeting",
                        dueDate = LocalDateTime.now().plusDays(1),
                        priority = Priority.URGENT,
                        category = "Work",
                        status = TaskStatus.IN_PROGRESS
                    ),
                    Task(
                        title = "Read book chapter",
                        description = "Chapter 5 of 'Clean Code'",
                        dueDate = LocalDateTime.now().plusDays(3),
                        priority = Priority.MEDIUM,
                        category = "Learning",
                        status = TaskStatus.TODO
                    ),
                    Task(
                        title = "Review code changes",
                        description = "Review pull request #123",
                        dueDate = LocalDateTime.now().plusHours(2),
                        priority = Priority.HIGH,
                        category = "Work",
                        status = TaskStatus.TODO
                    ),
                    Task(
                        title = "Update documentation",
                        description = "Update API documentation",
                        dueDate = LocalDateTime.now().plusDays(4),
                        priority = Priority.MEDIUM,
                        category = "Work",
                        status = TaskStatus.DONE
                    )
                )
                
                sampleTasks.forEach { task ->
                    taskRepository.insertTask(task)
                }
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun addTask(title: String, description: String, dueDate: LocalDateTime, priority: com.example.smartscheduler.data.model.Priority, category: String) {
        viewModelScope.launch {
            try {
                val task = Task(
                    title = title,
                    description = description,
                    dueDate = dueDate,
                    priority = priority,
                    category = category,
                    status = TaskStatus.TODO
                )
                taskRepository.insertTask(task)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun updateTask(task: Task) {
        viewModelScope.launch {
            try {
                val updatedTask = task.copy(updatedAt = LocalDateTime.now())
                taskRepository.updateTask(updatedTask)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun updateTaskStatus(task: Task, newStatus: TaskStatus) {
        viewModelScope.launch {
            try {
                val updatedTask = task.copy(
                    status = newStatus,
                    updatedAt = LocalDateTime.now()
                )
                taskRepository.updateTask(updatedTask)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun deleteTask(task: Task) {
        viewModelScope.launch {
            try {
                taskRepository.deleteTask(task)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun toggleTaskCompletion(task: Task) {
        viewModelScope.launch {
            try {
                val updatedTask = task.copy(
                    isCompleted = !task.isCompleted,
                    updatedAt = LocalDateTime.now()
                )
                taskRepository.updateTask(updatedTask)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun clearError() {
        _error.value = null
    }
} 