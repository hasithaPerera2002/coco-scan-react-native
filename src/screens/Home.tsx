import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text, Card, Button, Avatar, Snackbar } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import ImageResizer from 'react-native-image-resizer';
import * as jpeg from 'jpeg-js';
import RNFS from 'react-native-fs';

const MODEL_WIDTH = 224;
const MODEL_HEIGHT = 224;

const _b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean.charAt(i);
    const val = _b64chars.indexOf(c);
    if (val < 0) continue; 
    if (c === '=') break; 
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(output);
}

const MEAN = [0.485, 0.456, 0.406];
const STD  = [0.229, 0.224, 0.225];

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    loadTensorflowModel(
      require('../models/efficientnetv2_leaf_float32.tflite'),
    ).then(setModel);
  }, []);

  const handleScan = async () => {
    setResult('');
    setLoading(true);
    try {
      console.log('Launching Image Library');
      launchImageLibrary(
        { mediaType: 'photo', quality: 0.8 },
        async response => {
          console.log(response);

          if (response.didCancel) {
            setLoading(false);
            return;
          }
          if (response.errorCode) {
            setResult('ImagePicker Error: ' + response.errorMessage);
            setSnackbarVisible(true);
            setLoading(false);
            return;
          }
          if (response.assets && response.assets.length > 0) {
            if (!model) {
              setResult('Model not loaded yet.');
              setSnackbarVisible(true);
              setLoading(false);
              return;
            }
            const pickedUri = response.assets[0].uri || '';
            const imageUri = pickedUri.startsWith('file://') ? pickedUri.replace('file://', '') : pickedUri;
            if (!imageUri) {
              setResult('Invalid image URI.');
              setSnackbarVisible(true);
              setLoading(false);
              return;
            }
            try {
              console.log('Resizing image...');
              const resized = await ImageResizer.createResizedImage(
                imageUri,
                MODEL_WIDTH,
                MODEL_HEIGHT,
                'JPEG',
                80,
                0,
                undefined,
                false
              );
              const resizedPath = (resized.uri || (resized as any).path || '').toString();
              if (!resizedPath) {
                setResult('Failed to resize image.');
                setSnackbarVisible(true);
                setLoading(false);
                return;
              }
              const base64Str = await RNFS.readFile(resizedPath.replace('file://',''), 'base64');
              const binary = base64ToUint8Array(base64Str);
              const decoded = jpeg.decode(binary, { useTArray: true });
              if (!decoded || !decoded.data || !decoded.width || !decoded.height) {
                throw new Error('Failed to decode JPEG');
              }
              const W = decoded.width;
              const H = decoded.height;
              const input = new Float32Array(1 * MODEL_WIDTH * MODEL_HEIGHT * 3);
              for (let y = 0; y < MODEL_HEIGHT; y++) {
                for (let x = 0; x < MODEL_WIDTH; x++) {

                  const sx = Math.min(Math.floor((x * W) / MODEL_WIDTH), W - 1);
                  const sy = Math.min(Math.floor((y * H) / MODEL_HEIGHT), H - 1);
                  const srcOffset = (sy * W + sx) * 4; // RGBA
                  const dstIndex = (y * MODEL_WIDTH + x) * 3; // RGB index

                  const r = decoded.data[srcOffset];
                  const g = decoded.data[srcOffset + 1];
                  const b = decoded.data[srcOffset + 2];

                  input[dstIndex]     = r;
                  input[dstIndex + 1] = g;
                  input[dstIndex + 2] = b;
                }
              }
              console.log('Input sample:', Array.from(input.slice(0, 12)));

              const outputs = await model.run([input]);
              if (!outputs || !outputs[0]) {
                throw new Error('Empty TFLite output');
              }

              let predictions: number[] = [];
              const out0: any = outputs[0];
              if (out0 instanceof Float32Array) {
                predictions = Array.from(out0);
              } else if (Array.isArray(out0)) {
                predictions = out0 as number[];
              } else if (out0 && typeof out0 === 'object') {
                if ('data' in out0 && out0.data instanceof Float32Array) {
                  predictions = Array.from(out0.data as Float32Array);
                } else if ('buffer' in out0 && out0.buffer) {
                  predictions = Array.from(new Float32Array(out0.buffer));
                } else if (typeof (out0 as any).length === 'number') {
                  predictions = Array.from(out0 as any);
                }
              }
              if (!predictions.length || predictions.some((v) => !isFinite(v))) {
                throw new Error('Invalid predictions (empty or non-finite)');
              }

              const labels = [
                'Bud Root Dropping',
                'Bud Rot',
                'Gray Leaf Spot',
                'Leaf Rot',
                'Stem Bleeding',
                'Unknown'
              ];

              let maxLogit = -Infinity;
              for (let i = 0; i < predictions.length; i++) if (predictions[i] > maxLogit) maxLogit = predictions[i];
              const exps = new Array(predictions.length);
              let sumExp = 0;
              for (let i = 0; i < predictions.length; i++) { const e = Math.exp(predictions[i] - maxLogit); exps[i] = e; sumExp += e; }
              const probs = exps.map((e) => (sumExp > 0 ? e / sumExp : 0));

              let labelList = labels;
              if (labelList.length !== probs.length) {
                labelList = Array.from({ length: probs.length }, (_, i) => `Class ${i + 1}`);
              }
              const predIdx = probs.reduce((idx, p, i) => (p > probs[idx] ? i : idx), 0);
              const label = labelList[predIdx];
              const confidence = probs[predIdx];
              setResult(`TFLite Prediction: ${label} (${(confidence * 100).toFixed(2)}% confidence)`);
              console.log('Predictions:', probs);

            } catch (err) {
              console.log('Error during model inference:', err);

              const msg = (err && (err as any).message) ? (err as any).message : String(err);
              setResult('Model inference error: ' + msg);
            }
            setSnackbarVisible(true);
            setLoading(false);
          } else {
            setResult('No image selected.');
            setSnackbarVisible(true);
            setLoading(false);
          }
        },
      );
    } catch (e) {
      console.log('Error during scan:', e);

      let errorMsg = 'Error during scan.';
      if (typeof e === 'object' && e !== null && 'message' in e) {
        errorMsg = 'Error during scan: ' + (e as any).message;
      }
      setResult(errorMsg);
      setSnackbarVisible(true);
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
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
            onPress={handleScan}
            disabled={loading}
          >
            {loading ? 'Scanning...' : 'Scan Now'}
          </Button>
          {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
        </Card.Content>
      </Card>

      {/* Scan Result Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {result}
      </Snackbar>

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
  listContainer: { marginTop: 12, marginBottom: 100 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { width: 32, height: 32, marginRight: 12 },
  listText: { flex: 1 },
  diseaseName: { fontWeight: '600', fontSize: 15 },
  diseaseDetail: { fontSize: 13, color: '#777' },
});
