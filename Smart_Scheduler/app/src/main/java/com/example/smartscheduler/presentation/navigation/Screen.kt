package com.example.smartscheduler.presentation.navigation

sealed class Screen(val route: String) {
    // Bottom Navigation Tabs
    object Tasks : Screen("tasks")
    object Kanban : Screen("kanban")
    object Gantt : Screen("gantt")
    
    // Other screens
    object AddTask : Screen("add_task")
    object TaskDetail : Screen("task_detail/{taskId}") {
        fun createRoute(taskId: Long) = "task_detail/$taskId"
    }
    object Settings : Screen("settings")
} 