package com.example.smartscheduler.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.smartscheduler.data.model.Priority

@Composable
fun GanttLegend(
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Priority Legend",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Priority.values().forEach { priority ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        val priorityColor = when (priority) {
                            Priority.LOW -> Color(0xFF4CAF50)
                            Priority.MEDIUM -> Color(0xFF2196F3)
                            Priority.HIGH -> Color(0xFFFF9800)
                            Priority.URGENT -> Color(0xFFF44336)
                        }
                        
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .background(priorityColor, MaterialTheme.shapes.small)
                        )
                        
                        Text(
                            text = priority.name,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
} 