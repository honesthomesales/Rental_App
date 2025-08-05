package com.example.smartscheduler.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.smartscheduler.data.model.Priority
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTaskDialog(
    onDismiss: () -> Unit,
    onSave: (title: String, dueDate: LocalDateTime, priority: Priority) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var selectedDate by remember { mutableStateOf(LocalDate.now().plusDays(1)) }
    var selectedTime by remember { mutableStateOf(LocalTime.of(9, 0)) }
    var selectedPriority by remember { mutableStateOf(Priority.MEDIUM) }
    var isTitleError by remember { mutableStateOf(false) }
    
    val priorities = Priority.values()
    val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
    val dateFormatter = DateTimeFormatter.ofPattern("MMM dd, yyyy")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = MaterialTheme.shapes.medium
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Add New Task",
                    style = MaterialTheme.typography.headlineSmall
                )
                
                // Task Title
                OutlinedTextField(
                    value = title,
                    onValueChange = { 
                        title = it
                        isTitleError = false
                    },
                    label = { Text("Task Title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    isError = isTitleError,
                    supportingText = if (isTitleError) {
                        { Text("Title is required") }
                    } else null
                )
                
                // Due Date Section
                Text(
                    text = "Due Date & Time",
                    style = MaterialTheme.typography.titleSmall
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Date display
                    OutlinedTextField(
                        value = selectedDate.format(dateFormatter),
                        onValueChange = { },
                        label = { Text("Date") },
                        modifier = Modifier.weight(1f),
                        readOnly = true,
                        leadingIcon = {
                            Icon(Icons.Default.CalendarToday, contentDescription = null)
                        }
                    )
                    
                    // Time display
                    OutlinedTextField(
                        value = selectedTime.format(timeFormatter),
                        onValueChange = { },
                        label = { Text("Time") },
                        modifier = Modifier.weight(1f),
                        readOnly = true,
                        leadingIcon = {
                            Icon(Icons.Default.Schedule, contentDescription = null)
                        }
                    )
                }
                
                // Quick date options
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = selectedDate == LocalDate.now(),
                        onClick = { 
                            selectedDate = LocalDate.now()
                            selectedTime = LocalTime.now().plusHours(1)
                        },
                        label = { Text("Today") },
                        modifier = Modifier.weight(1f)
                    )
                    
                    FilterChip(
                        selected = selectedDate == LocalDate.now().plusDays(1),
                        onClick = { 
                            selectedDate = LocalDate.now().plusDays(1)
                            selectedTime = LocalTime.of(9, 0)
                        },
                        label = { Text("Tomorrow") },
                        modifier = Modifier.weight(1f)
                    )
                    
                    FilterChip(
                        selected = selectedDate == LocalDate.now().plusDays(7),
                        onClick = { 
                            selectedDate = LocalDate.now().plusDays(7)
                            selectedTime = LocalTime.of(9, 0)
                        },
                        label = { Text("Next Week") },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                // Priority Section
                Text(
                    text = "Priority",
                    style = MaterialTheme.typography.titleSmall
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    priorities.forEach { priority ->
                        FilterChip(
                            selected = selectedPriority == priority,
                            onClick = { selectedPriority = priority },
                            label = { Text(priority.name) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                
                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    
                    Button(
                        onClick = {
                            if (title.isBlank()) {
                                isTitleError = true
                                return@Button
                            }
                            
                            val dueDateTime = LocalDateTime.of(selectedDate, selectedTime)
                            onSave(title, dueDateTime, selectedPriority)
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save")
                    }
                }
            }
        }
    }
} 