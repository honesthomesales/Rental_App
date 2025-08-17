# SmartScheduler

A modern Android task management app built with Kotlin and Jetpack Compose, following MVVM architecture principles.

## Features

- **Task Management**: Create, edit, delete, and mark tasks as complete
- **Priority Levels**: Set task priorities (Low, Medium, High, Urgent)
- **Categories**: Organize tasks by categories
- **Due Dates**: Set due dates and times for tasks
- **Modern UI**: Built with Material Design 3 and Jetpack Compose
- **Offline Storage**: Local database using Room
- **Dependency Injection**: Hilt for clean architecture

## Architecture

The app follows the **MVVM (Model-View-ViewModel)** architecture pattern:

### Data Layer
- **Models**: Data classes representing the domain entities
- **Repository**: Abstraction layer for data operations
- **Local Database**: Room database for offline storage
- **DAO**: Data Access Objects for database operations

### Presentation Layer
- **ViewModels**: Business logic and state management
- **Composables**: UI components using Jetpack Compose
- **Navigation**: Type-safe navigation using Navigation Compose

### DI Layer
- **Hilt**: Dependency injection for clean architecture
- **Modules**: Configuration for providing dependencies

## Project Structure

```
app/src/main/java/com/example/smartscheduler/
├── data/
│   ├── local/
│   │   ├── AppDatabase.kt
│   │   ├── TaskDao.kt
│   │   └── Converters.kt
│   ├── model/
│   │   └── Task.kt
│   └── repository/
│       └── TaskRepository.kt
├── di/
│   └── AppModule.kt
├── presentation/
│   ├── navigation/
│   │   └── Screen.kt
│   └── viewmodel/
│       └── TaskViewModel.kt
├── ui/
│   ├── components/
│   │   └── TaskItem.kt
│   ├── navigation/
│   │   └── SmartSchedulerNavigation.kt
│   ├── screens/
│   │   ├── TaskListScreen.kt
│   │   ├── AddTaskScreen.kt
│   │   ├── TaskDetailScreen.kt
│   │   └── SettingsScreen.kt
│   └── theme/
│       ├── Color.kt
│       ├── Theme.kt
│       └── Type.kt
├── MainActivity.kt
└── SmartSchedulerApplication.kt
```

## Technologies Used

- **Kotlin**: Primary programming language
- **Jetpack Compose**: Modern UI toolkit
- **Material Design 3**: Design system
- **Room**: Local database
- **Hilt**: Dependency injection
- **Navigation Compose**: Type-safe navigation
- **Coroutines**: Asynchronous programming
- **Flow**: Reactive streams
- **ViewModel**: UI state management
- **LiveData**: Observable data holder

## Getting Started

### Prerequisites

- Android Studio Arctic Fox or later
- Android SDK 24 or higher
- Kotlin 1.9.10 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/SmartScheduler.git
   ```

2. Open the project in Android Studio

3. Sync the project with Gradle files

4. Build and run the app on an emulator or physical device

## Build Configuration

The project uses Gradle with Kotlin DSL:

- **compileSdk**: 34
- **minSdk**: 24
- **targetSdk**: 34
- **Kotlin**: 1.9.10
- **Compose Compiler**: 1.5.1

## Key Dependencies

```kotlin
// Compose
implementation(platform("androidx.compose:compose-bom:2023.10.01"))
implementation("androidx.compose.ui:ui")
implementation("androidx.compose.material3:material3")

// Navigation
implementation("androidx.navigation:navigation-compose:2.7.5")

// Room
implementation("androidx.room:room-runtime:2.6.1")
implementation("androidx.room:room-ktx:2.6.1")

// Hilt
implementation("com.google.dagger:hilt-android:2.48")
implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google for Jetpack Compose and Material Design 3
- Android team for the excellent documentation and tools 