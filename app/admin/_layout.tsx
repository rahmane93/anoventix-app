import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();

  const isAdminOrMod =
    isAuthenticated &&
    (user?.roles?.includes('ROLE_ADMINISTRATEUR') ||
      user?.roles?.includes('ROLE_MODERATEUR'));

  if (!isAdminOrMod) {
    return <Redirect href="/(tabs)/explore" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Administration',
          headerLeft: () => (
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={colors.white}
              style={{ marginLeft: 4 }}
            />
          ),
        }}
      />
      <Stack.Screen name="users" options={{ title: 'Utilisateurs' }} />
      <Stack.Screen name="users/[id]" options={{ title: 'Détail utilisateur' }} />
      <Stack.Screen name="signalements" options={{ title: 'Signalements' }} />
      <Stack.Screen name="annonces" options={{ title: 'Annonces' }} />
    </Stack>
  );
}
