import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme';
import {
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';

export default function RootLayout() {
  const { isAuthenticated, isLoading, hydrateFromStorage } = useAuthStore();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Appliquer Nunito comme police par défaut sur tous les Text
  if (fontsLoaded) {
    const anyText = Text as unknown as { defaultProps?: { style?: object } };
    anyText.defaultProps = anyText.defaultProps ?? {};
    anyText.defaultProps.style = { fontFamily: 'Nunito_400Regular' };
  }

  useEffect(() => {
    hydrateFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onChangePasswordScreen = segments[1] === 'change-password';

    // Redirect authenticated users away from auth screens (except change-password)
    if (isAuthenticated && inAuthGroup && !onChangePasswordScreen) {
      router.replace('/(tabs)');
    }
    // Public routes (explore, annonce detail) are accessible without auth.
    // Each protected screen handles its own redirect to login.
  }, [isAuthenticated, isLoading, segments[0], segments[1]]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="annonce/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#1A3C6E',
            headerTitleStyle: { fontWeight: '600', color: '#1A1F36' },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true, title: '' }} />
        <Stack.Screen
          name="entreprise"
          options={{
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#1A3C6E',
            headerTitleStyle: { fontWeight: '600', color: '#1A1F36' },
            title: 'Mon entreprise',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)/profile');
                  }
                }}
                style={styles.headerBackButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="messagerie/index"
          options={{
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: colors.headerBackground },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '700', color: colors.textPrimary },
            title: 'Messagerie',
          }}
        />
        <Stack.Screen
          name="messagerie/[conversationId]"
          options={{
            headerShown: true,
            headerBackTitle: 'Retour',
            headerStyle: { backgroundColor: colors.headerBackground },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '700', color: colors.textPrimary },
            title: 'Conversation',
          }}
        />
      </Stack>
      <StatusBar style="dark" backgroundColor={colors.headerBackground} />
      {/* Overlay de chargement : le Stack est TOUJOURS monté pour que
          Expo Router puisse initialiser correctement l'URL initiale. */}
      {(isLoading || !fontsLoaded) && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  headerBackButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});
