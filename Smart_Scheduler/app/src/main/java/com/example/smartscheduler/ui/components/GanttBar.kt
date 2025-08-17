package com.example.smartscheduler.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.smartscheduler.data.model.Priority
import com.example.smartscheduler.data.model.Task
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun GanttBar(
    task: Task,
    onTaskClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val priorityColor = when (task.priority) {
        Priority.LOW -> Color(0xFF4CAF50) // Green
        Priority.MEDIUM -> Color(0xFF2196F3) // Blue
        Priority.HIGH -> Color(0xFFFF9800) // Orange
        Priority.URGENT -> Color(0xFFF44336) // Red
    }
    
    val dateFormatter = DateTimeFormatter.ofPattern("MMM dd")
    
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(40.dp)
            .clickable { onTaskClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(priorityColor.copy(alpha = 0.2f))
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Priority indicator
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(priorityColor, MaterialTheme.shapes.small)
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // Task title
            Text(
                text = task.title,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            
            // Due date
            Text(
                text = task.dueDate.format(dateFormatter),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
} 