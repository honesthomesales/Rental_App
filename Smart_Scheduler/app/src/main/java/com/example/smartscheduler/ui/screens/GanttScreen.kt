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
import com.example.smartscheduler.presentation.viewmodel.TaskViewModel
import com.example.smartscheduler.ui.components.AddTaskDialog
import com.example.smartscheduler.ui.components.GanttDayColumn
import com.example.smartscheduler.ui.components.GanttLegend
import com.example.smartscheduler.ui.components.GanttTimeline
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GanttScreen(
    onNavigateToAddTask: () -> Unit,
    viewModel: TaskViewModel = hiltViewModel()
) {
    val allTasks by viewModel.tasks.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    
    var showAddTaskDialog by remember { mutableStateOf(false) }

    // Calculate date range for the timeline
    val dateRange = remember(allTasks) {
        if (allTasks.isEmpty()) {
            val today = LocalDate.now()
            today to today.plusDays(6) // Show 7 days if no tasks
        } else {
            val minDate = allTasks.minOfOrNull { it.dueDate.toLocalDate() } ?: LocalDate.now()
            val maxDate = allTasks.maxOfOrNull { it.dueDate.toLocalDate() } ?: LocalDate.now()
            minDate to maxDate.plusDays(1) // Add one day buffer
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gantt Chart") },
                actions = {
                    IconButton(onClick = { showAddTaskDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Task")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                allTasks.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Gantt Chart",
                                style = MaterialTheme.typography.headlineMedium
                            )
                            Text(
                                text = "Visualize project timelines",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "No tasks yet. Add some tasks to see the timeline!",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                else -> {
                    // Priority Legend
                    GanttLegend(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                    
                    // Timeline header
                    GanttTimeline(
                        startDate = dateRange.first,
                        endDate = dateRange.second,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Gantt chart columns
                    LazyRow(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        val daysInRange = ChronoUnit.DAYS.between(dateRange.first, dateRange.second) + 1
                        
                        items(daysInRange.toInt()) { dayOffset ->
                            val currentDate = dateRange.first.plusDays(dayOffset.toLong())
                            val tasksForDay = allTasks.filter { 
                                it.dueDate.toLocalDate() == currentDate 
                            }
                            
                            GanttDayColumn(
                                date = currentDate,
                                tasks = tasksForDay,
                                onTaskClick = { task ->
                                    // TODO: Navigate to task detail
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