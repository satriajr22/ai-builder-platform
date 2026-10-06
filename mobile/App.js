import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.100:3000';

const Colors = {
  bg: '#07111f',
  sidebar: 'rgba(15, 23, 42, 0.9)',
  panel: 'rgba(15, 23, 42, 0.7)',
  card: 'rgba(17, 24, 39, 0.8)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
  text: '#e5eefb',
  muted: '#a5b4cf',
  primary: '#7c3aed',
  secondary: '#1ea5ff',
  success: '#34d399',
  danger: '#ef4444',
  warning: '#f59e0b',
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectStatus, setProjectStatus] = useState('idle');
  const [currentPhase, setCurrentPhase] = useState('analyzing');
  const [logs, setLogs] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [publishUrl, setPublishUrl] = useState('');

  const addLog = (message) => {
    setLogs((prev) => [{ id: Date.now(), text: message }, ...prev]);
  };

  const generateProject = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Silakan masukkan deskripsi website atau aplikasi yang ingin dibuat.');
      return;
    }

    setIsGenerating(true);
    setProjectStatus('analyzing');
    setCurrentPhase('analyzing');
    setLogs([]);
    addLog('AI sedang menganalisis kebutuhan pengguna...');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/generate`, {
        prompt,
      });

      if (response.data && response.data.projectId) {
        setProjectId(response.data.projectId);
        setProjectFiles(response.data.files || []);
        setPreviewUrl(response.data.previewUrl || '');
        setPublishUrl(response.data.deploymentUrl || '');
        setProjectStatus('ready');
        setCurrentPhase('ready');
        addLog('Project siap untuk preview dan publish!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Generation failed';
      setProjectStatus('error');
      addLog(`Error: ${errorMessage}`);
      Alert.alert('Generation Error', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!projectId) {
      Alert.alert('Error', 'Tidak ada project aktif untuk dipublish.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/publish`, {
        projectId,
      });

      if (response.data.ok) {
        setPublishUrl(response.data.deploymentUrl);
        addLog('Project berhasil dipublish!');
        Alert.alert('Success', 'Project berhasil dipublish ke ' + response.data.deploymentUrl);
      }
    } catch (error) {
      Alert.alert('Publish Error', error.message);
    }
  };

  const handlePreview = () => {
    if (!previewUrl) {
      Alert.alert('Error', 'Preview URL tidak tersedia.');
      return;
    }

    Linking.openURL(previewUrl).catch(() => {
      Alert.alert('Error', 'Tidak bisa membuka preview URL.');
    });
  };

  const getStatusColor = () => {
    if (projectStatus === 'ready') return Colors.success;
    if (projectStatus === 'error') return Colors.danger;
    if (projectStatus === 'analyzing') return Colors.warning;
    return Colors.muted;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>AI</Text>
        </View>
        <View>
          <Text style={styles.eyebrow}>Builder Studio</Text>
          <Text style={styles.title}>Project AI</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi Project</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Jelaskan website atau aplikasi yang ingin kamu buat..."
            placeholderTextColor={Colors.muted}
            multiline
            numberOfLines={6}
            value={prompt}
            onChangeText={setPrompt}
            editable={!isGenerating}
          />
          <TouchableOpacity
            style={[
              styles.generateBtn,
              isGenerating && styles.generateBtnDisabled,
            ]}
            onPress={generateProject}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.generateBtnText}>Generate</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.phaseHeader}>
            <Text style={styles.sectionTitle}>Workflow Status</Text>
            <View
              style={[
                styles.phaseBadge,
                { backgroundColor: getStatusColor() + '20' },
              ]}
            >
              <Text
                style={[
                  styles.phaseBadgeText,
                  { color: getStatusColor() },
                ]}
              >
                {currentPhase.toUpperCase()}
              </Text>
            </View>
          </View>

          <FlatList
            data={logs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.logItem}>
                <Text style={styles.logText}>• {item.text}</Text>
              </View>
            )}
            scrollEnabled={false}
            ListEmptyComponent=(
              <Text style={styles.emptyLog}>
                Logs akan muncul di sini saat project diproses...
              </Text>
            )
          />
        </View>

        {projectStatus === 'ready' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Output</Text>

            <View style={styles.box}>
              <Text style={styles.boxLabel}>Files</Text>
              <View style={styles.tagList}>
                {projectFiles.map((file) => (
                  <View key={file} style={styles.tag}>
                    <Text style={styles.tagText}>{file}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.box}>
              <Text style={styles.boxLabel}>Preview URL</Text>
              <Text
                style={styles.urlText}
                onPress={handlePreview}
              >
                {previewUrl || 'Not available'}
              </Text>
            </View>

            <View style={styles.box}>
              <Text style={styles.boxLabel}>Deployment URL</Text>
              <Text style={styles.urlText}>
                {publishUrl || 'Not published'}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handlePreview}
              >
                <Text style={styles.secondaryBtnText}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handlePublish}
              >
                <Text style={styles.primaryBtnText}>Publish</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: Colors.cardBorder,
    borderBottomWidth: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  eyebrow: {
    color: Colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: Colors.panel,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  textarea: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    color: Colors.text,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  phaseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logItem: {
    paddingVertical: 8,
    borderBottomColor: Colors.cardBorder,
    borderBottomWidth: 1,
  },
  logText: {
    color: Colors.muted,
    fontSize: 13,
  },
  emptyLog: {
    color: Colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  box: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  boxLabel: {
    color: Colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#3b82f620',
    borderColor: '#60a5fa33',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tagText: {
    color: '#cfe4ff',
    fontSize: 12,
  },
  urlText: {
    color: '#cfe4ff',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
});
