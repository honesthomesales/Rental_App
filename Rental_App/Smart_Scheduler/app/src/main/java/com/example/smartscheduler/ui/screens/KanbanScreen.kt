package com.example.smartscheduler.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.smartscheduler.data.model.TaskStatus
import com.example.smartscheduler.presentation.viewmodel.TaskViewModel
import com.example.smartscheduler.ui.components.AddTaskDialog
import com.example.smartscheduler.ui.components.KanbanColumn

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KanbanScreen(
    onNavigateToAddTask: () -> Unit,
    viewModel: TaskViewModel = hiltViewModel()
) {
    val allTasks by viewModel.tasks.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    
    var showAddTaskDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Kanban Board") },
                actions = {
                    IconButton(onClick = { showAddTaskDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Task")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                allTasks.isEmpty() -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Kanban Board",
                            style = MaterialTheme.typography.headlineMedium
                        )
                        Text(
                            text = "Drag and drop tasks between columns",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "No tasks yet. Add some tasks to get started!",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                else -> {
                    LazyRow(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(TaskStatus.values()) { status ->
                            val tasksInColumn = allTasks.filter { it.status == status }
                            KanbanColumn(
                                status = status,
                                tasks = tasksInColumn,
                                onTaskClick = { task ->
                                    // TODO: Navigate to task detail
                                },
                                onTaskToggle = { task ->
                                    viewModel.toggleTaskCompletion(task)
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    // Add Task Dialog
    if (showAddTaskDialog) {
        AddTaskDialog(
            onDismiss = { showAddTaskDialog = false },
            onSave = { title, dueDate, priority ->
                viewModel.addTask(
                    title = title,
                    description = "",
                    dueDate = dueDate,
                    priority = priority,
                    category = ""
                )
                showAddTaskDialog = false
            }
        )
    }
} 