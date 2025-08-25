import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { PaperProvider, DefaultTheme, MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',       // Coconut leaf green
    secondary: '#FFB300',     // Coconut yellow
    tertiary: '#6D4C41',      // Coconut shell brown
    background: '#FAFAF4',    // Light coconut husk background
    surface: '#FFFFFF',
    text: '#212121',
    onSurface: '#333333',
    error: '#D32F2F',
  },
  roundness: 6,
};

function App() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default App;
