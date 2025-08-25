import * as React from 'react';
import { View, StyleSheet, ImageBackground, SafeAreaView, StatusBar } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#2E7D32' }}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
      <ImageBackground
        source={require('../assets/bg_image.jpeg')}
        style={styles.background}
      >
        <Text style={styles.title}>Coco Scan</Text>
        <Text style={styles.subtitle}>
          Your assistant for analyzing coconut leaves.
        </Text>
        <Button
          mode="contained"
          style={styles.cta}
          contentStyle={{ paddingVertical: 12 }}
          onPress={() => navigation.navigate('Home')}
        >
          Start
        </Button>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f0fff0',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(240,255,240,0.9)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 100,
  },
  cta: {
    backgroundColor: '#2E7D32',
    borderRadius: 30,
    minWidth: 200,
  },
});
