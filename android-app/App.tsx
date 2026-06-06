/**
 * Master RN, Android. App root.
 * Phase 2: navigation container with Home + Module Detail. The remaining
 * screens and bottom tabs land in later tasks.
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EFE6" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
