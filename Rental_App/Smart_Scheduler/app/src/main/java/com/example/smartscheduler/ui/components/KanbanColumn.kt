package com.example.smartscheduler.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.smartscheduler.data.model.Task
import com.example.smartscheduler.data.model.TaskStatus

@Composable
fun KanbanColumn(
    status: TaskStatus,
    tasks: List<Task>,
    onTaskClick: (Task) -> Unit,
    onTaskToggle: (Task) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .width(280.dp)
            .padding(8.dp)
    ) {
        // Column header
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = when (status) {
                    TaskStatus.TODO -> MaterialTheme.colorScheme.primaryContainer
                    TaskStatus.IN_PROGRESS -> MaterialTheme.colorScheme.secondaryContainer
                    TaskStatus.DONE -> MaterialTheme.colorScheme.tertiaryContainer
                }
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = status.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    color = when (status) {
                        TaskStatus.TODO -> MaterialTheme.colorScheme.onPrimaryContainer
                        TaskStatus.IN_PROGRESS -> MaterialTheme.colorScheme.onSecondaryContainer
                        TaskStatus.DONE -> MaterialTheme.colorScheme.onTertiaryContainer
                    }
                )
                
                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = when (status) {
                        TaskStatus.TODO -> MaterialTheme.colorScheme.primary
                        TaskStatus.IN_PROGRESS -> MaterialTheme.colorScheme.secondary
                        TaskStatus.DONE -> MaterialTheme.colorScheme.tertiary
                    }
                ) {
                    Text(
                        text = tasks.size.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Tasks list
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(tasks) { task ->
                KanbanCard(
                    task = task,
                    onTaskClick = { onTaskClick(task) },
                    onTaskToggle = { onTaskToggle(task) }
                )
            }
        }
    }
} 