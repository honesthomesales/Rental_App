/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const textStyle = {
    color: isDarkMode ? Colors.white : Colors.black,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, textStyle]}>Rental Management</Text>
          <Text style={[styles.headerSubtitle, textStyle]}>Honest Home Sales</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, textStyle]}>Welcome!</Text>
            <Text style={[styles.sectionText, textStyle]}>
              Your Android rental management app is now running successfully!
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, textStyle]}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, textStyle]}>✓</Text>
                <Text style={[styles.statLabel, textStyle]}>App Running</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, textStyle]}>✓</Text>
                <Text style={[styles.statLabel, textStyle]}>Build Success</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default App;
