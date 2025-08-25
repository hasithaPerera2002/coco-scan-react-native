import * as React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar } from 'react-native-paper';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Image size={48} source={require('../assets/bg_image.jpeg')} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.welcome}>Welcome Back! 👋</Text>
          <Text variant="bodySmall">Coconut Farmer</Text>
        </View>
      </View>

      {/* Hero Banner */}
      <Card style={styles.heroCard}>
        <Card.Cover source={require('../assets/bg_image.jpeg')} />
        <Card.Content>
          <Text style={styles.heroTitle}>
            Learn how CocoScan helps farmers detect diseases
          </Text>
          <Text style={styles.heroSubtitle}>
            Identify early coconut leaf diseases using AI powered detection.
          </Text>
        </Card.Content>
      </Card>

      {/* Scan Section */}
      <Card style={styles.scanCard}>
        <Card.Content>
          <Text style={styles.scanTitle}>
            Diagnose your coconut leaves with AI
          </Text>
          <Text style={styles.scanSubtitle}>
            Upload or scan a leaf to detect common diseases instantly.
          </Text>
          <Button
            mode="contained"
            style={styles.scanButton}
            onPress={() => console.log('Scan pressed')}
          >
            Scan Now
          </Button>
        </Card.Content>
      </Card>

      {/* Common Diseases */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Common Coconut Leaf Diseases</Text>

        <View style={styles.listItem}>
          <Image
            source={require('../assets/bg_image.jpeg')}
            style={styles.icon}
          />
          <View style={styles.listText}>
            <Text style={styles.diseaseName}>Gray Leaf Spot</Text>
            <Text style={styles.diseaseDetail}>Causes premature leaf drop</Text>
          </View>
        </View>

        <View style={styles.listItem}>
          <Image
            source={require('../assets/bg_image.jpeg')}
            style={styles.icon}
          />
          <View style={styles.listText}>
            <Text style={styles.diseaseName}>Bud Rot</Text>
            <Text style={styles.diseaseDetail}>
              Destroys young leaves & bud
            </Text>
          </View>
        </View>

        <View style={styles.listItem}>
          <Image
            source={require('../assets/bg_image.jpeg')}
            style={styles.icon}
          />
          <View style={styles.listText}>
            <Text style={styles.diseaseName}>Stem Bleeding</Text>
            <Text style={styles.diseaseDetail}>
              Dark fluid oozes from trunk
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF9' },
  scrollContent: { padding: 16, paddingBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  welcome: { fontWeight: 'bold', fontSize: 16 },
  heroCard: { marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  heroTitle: { marginTop: 12, fontWeight: 'bold', fontSize: 16 },
  heroSubtitle: { fontSize: 14, color: '#555', marginTop: 4 },
  scanCard: { marginBottom: 16, borderRadius: 12 },
  scanTitle: { fontWeight: 'bold', fontSize: 16 },
  scanSubtitle: { fontSize: 14, color: '#666', marginVertical: 8 },
  scanButton: { marginTop: 8, backgroundColor: '#2E7D32', borderRadius: 24 },
  listContainer: { marginTop: 12 ,marginBottom: 100 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { width: 32, height: 32, marginRight: 12 },
  listText: { flex: 1 },
  diseaseName: { fontWeight: '600', fontSize: 15 },
  diseaseDetail: { fontSize: 13, color: '#777' },
});
