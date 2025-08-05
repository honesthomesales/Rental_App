package com.example.smartscheduler.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.smartscheduler.presentation.navigation.Screen
import com.example.smartscheduler.ui.screens.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SmartSchedulerNavigation(
    navController: NavHostController = rememberNavController()
) {
    val bottomNavController = rememberNavController()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Smart Scheduler") },
                actions = {
                    IconButton(
                        onClick = { 
                            navController.navigate(Screen.Settings.route)
                        }
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by bottomNavController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                
                val screens = listOf(
                    Triple(Screen.Tasks, "Tasks", Icons.Default.List),
                    Triple(Screen.Kanban, "Kanban", Icons.Default.ViewColumn),
                    Triple(Screen.Gantt, "Gantt", Icons.Default.Timeline)
                )
                
                screens.forEach { (screen, title, icon) ->
                    NavigationBarItem(
                        icon = { Icon(icon, contentDescription = title) },
                        label = { Text(title) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            bottomNavController.navigate(screen.route) {
                                popUpTo(bottomNavController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = bottomNavController,
            startDestination = Screen.Tasks.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(Screen.Tasks.route) {
                TasksScreen(
                    onNavigateToAddTask = { /* Handled by FAB in TasksScreen */ },
                    onNavigateToTaskDetail = { taskId -> 
                        navController.navigate(Screen.TaskDetail.createRoute(taskId)) 
                    }
                )
            }
            
            composable(Screen.Kanban.route) {
                KanbanScreen(
                    onNavigateToAddTask = { navController.navigate(Screen.AddTask.route) }
                )
            }
            
            composable(Screen.Gantt.route) {
                GanttScreen(
                    onNavigateToAddTask = { navController.navigate(Screen.AddTask.route) }
                )
            }
        }
        
        // Separate NavHost for non-bottom navigation screens
        NavHost(
            navController = navController,
            startDestination = Screen.Tasks.route
        ) {
            composable(Screen.AddTask.route) {
                AddTaskScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            
            composable(
                route = Screen.TaskDetail.route,
                arguments = listOf(
                    navArgument("taskId") { type = NavType.LongType }
                )
            ) { backStackEntry ->
                val taskId = backStackEntry.arguments?.getLong("taskId") ?: 0L
                TaskDetailScreen(
                    taskId = taskId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            
            composable(Screen.Settings.route) {
                SettingsScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
} 