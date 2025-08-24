import React, { useRef } from 'react';
import { Text, Platform, Alert } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import JobsScreen from './src/screens/JobsScreen';
import QuotesScreen from './src/screens/QuotesScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NewJobScreen from './src/screens/NewJobScreen';

// Import voice control
import VoiceControl from './src/components/VoiceControl';
import { VoiceCommand } from './src/services/VoiceService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for Jobs tab
const JobsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="JobsList" component={JobsScreen} />
    <Stack.Screen name="NewJob" component={NewJobScreen} />
  </Stack.Navigator>
);

const App = () => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Define voice commands
  const voiceCommands: VoiceCommand[] = [
    {
      command: 'dashboard',
      action: () => navigationRef.current?.navigate('Dashboard'),
      description: 'Navigate to Dashboard'
    },
    {
      command: 'jobs',
      action: () => navigationRef.current?.navigate('Jobs'),
      description: 'Navigate to Jobs'
    },
    {
      command: 'quotes',
      action: () => navigationRef.current?.navigate('Quotes'),
      description: 'Navigate to Quotes'
    },
    {
      command: 'invoices',
      action: () => navigationRef.current?.navigate('Invoices'),
      description: 'Navigate to Invoices'
    },
    {
      command: 'profile',
      action: () => navigationRef.current?.navigate('Profile'),
      description: 'Navigate to Profile'
    },
    {
      command: 'new job',
      action: () => {
        navigationRef.current?.navigate('Jobs');
        // Navigate to NewJob screen after a short delay
        setTimeout(() => {
          navigationRef.current?.navigate('NewJob');
        }, 100);
      },
      description: 'Create a new job'
    },
    {
      command: 'add quote',
      action: () => {
        // TODO: Implement quote creation
        console.log('Adding new quote...');
      },
      description: 'Add a new quote'
    },
    {
      command: 'generate invoice',
      action: () => {
        // TODO: Implement invoice generation
        console.log('Generating invoice...');
      },
      description: 'Generate a new invoice'
    },
    {
      command: 'help',
      action: () => {
        // This will be handled by the VoiceControl component
        console.log('Showing help...');
      },
      description: 'Show available voice commands'
    },
  ];

  const handleCommandRecognized = (command: string) => {
    console.log('Voice command recognized in App:', command);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              paddingBottom: Platform.OS === 'android' ? 30 : 8,
              paddingTop: 8,
              height: Platform.OS === 'android' ? 90 : 60,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#64748B',
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
            },
            tabBarIconStyle: {
              marginTop: 4,
            },
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Text style={{ color, fontSize: size }}>📊</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Jobs"
            component={JobsStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Text style={{ color, fontSize: size }}>🔨</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Quotes"
            component={QuotesScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Text style={{ color, fontSize: size }}>📋</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Invoices"
            component={InvoicesScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Text style={{ color, fontSize: size }}>💰</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Text style={{ color, fontSize: size }}>👤</Text>
              ),
            }}
          />
        </Tab.Navigator>

        {/* Voice Control Component */}
        <VoiceControl 
          commands={voiceCommands}
          onCommandRecognized={handleCommandRecognized}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
