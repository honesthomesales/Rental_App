import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import DashboardScreen from './src/screens/DashboardScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import TenantsScreen from './src/screens/TenantsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: '#1976d2',
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: '#1976d2',
              },
              headerTintColor: '#fff',
            }}
          >
            <Tab.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ 
                title: 'Dashboard',
                tabBarLabel: 'Dashboard'
              }} 
            />
            <Tab.Screen 
              name="Properties" 
              component={PropertiesScreen} 
              options={{ 
                title: 'Properties',
                tabBarLabel: 'Properties'
              }} 
            />
            <Tab.Screen 
              name="Tenants" 
              component={TenantsScreen} 
              options={{ 
                title: 'Tenants',
                tabBarLabel: 'Tenants'
              }} 
            />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
