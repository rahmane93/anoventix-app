import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertBannerProps {
  message: string;
  variant?: AlertVariant;
}

// ─── Config ───────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; iconName: IoniconsName }> = {
  error:   { bg: colors.errorLight,   border: colors.error,   text: colors.error,   iconName: 'close-circle' },
  success: { bg: colors.successLight, border: colors.success, text: colors.success, iconName: 'checkmark-circle' },
  info:    { bg: colors.infoLight,    border: colors.info,    text: colors.info,    iconName: 'information-circle' },
  warning: { bg: colors.warningLight, border: colors.warning, text: colors.warning, iconName: 'warning' },
};

// ─── Composant ────────────────────────────────────────────────────────────────

export function AlertBanner({ message, variant = 'error' }: AlertBannerProps) {
  const config = variantConfig[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <Ionicons name={config.iconName} size={18} color={config.text} style={styles.icon} />
      <Text style={[styles.message, { color: config.text }]}>{message}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0,
    borderLeftWidth: 4,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  icon: {
    lineHeight: 22,
    marginTop: 1,
  },
  message: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
  },
});
