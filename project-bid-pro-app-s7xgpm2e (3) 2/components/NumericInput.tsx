import React from 'react';
import { StyleSheet, View, Text, TextInput, Platform } from 'react-native';
import { brand } from '@/constants/theme';

interface NumericInputProps {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  unit?: string;
  placeholder?: string;
  decimals?: boolean;
}

export function NumericInput({
  label,
  value,
  onChangeText,
  unit,
  placeholder = '0',
  decimals = true,
}: NumericInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {},
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={brand.textTertiary}
          keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
          returnKeyType="done"
          selectTextOnFocus
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: brand.textPrimary,
  },
  unit: {
    fontSize: 14,
    color: brand.textTertiary,
    marginLeft: 8,
    fontWeight: '500',
  },
});
