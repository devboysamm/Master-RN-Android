/**
 * Master RN, Android. App root.
 * Phase 2: navigation container with Home + Module Detail. The remaining
 * screens and bottom tabs land in later tasks.
 */
import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    // GestureHandlerRootView must wrap the whole tree so the slide-to-complete
    // pan gesture (react-native-gesture-handler) receives touches.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#F5EFE6" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
