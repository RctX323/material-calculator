/**
 * Full-screen measurement system picker shown on first launch only.
 * After user selects US or Metric it saves the preference and never shows again.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brand } from '@/constants/theme';
import { MeasureSystem } from '@/hooks/useWeightUnit';

interface Props {
  visible: boolean;
  onSelect: (system: MeasureSystem) => void;
}

export function MeasureSystemPicker({ visible, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Logo area */}
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>BID PRO</Text>
          </View>

          <Text style={styles.heading}>Choose Your{'\n'}Measurement System</Text>
          <Text style={styles.sub}>
            This sets how weights are displayed throughout the app.
            You can change it any time in the header.
          </Text>

          {/* US */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => onSelect('US')}
            activeOpacity={0.85}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>🇺🇸</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>US / Imperial</Text>
              <Text style={styles.optionDesc}>Tons · Cubic yards</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brand.orange} />
          </TouchableOpacity>

          {/* Metric */}
          <TouchableOpacity
            style={styles.option}
            onPress={() => onSelect('metric')}
            activeOpacity={0.85}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>🌍</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Metric</Text>
              <Text style={styles.optionDesc}>Tonnes · Cubic metres</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brand.orange} />
          </TouchableOpacity>

          <Text style={styles.hint}>You can always change this later</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: brand.bgCard,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: brand.border,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: brand.orange,
    letterSpacing: 3,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: brand.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
  },
  sub: {
    fontSize: 14,
    color: brand.textTertiary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.bgElevated,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: brand.border,
    marginBottom: 12,
    gap: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brand.textPrimary,
  },
  optionDesc: {
    fontSize: 13,
    color: brand.textTertiary,
    marginTop: 2,
  },
  hint: {
    fontSize: 12,
    color: brand.textTertiary,
    textAlign: 'center',
    marginTop: 8,
  },
});
