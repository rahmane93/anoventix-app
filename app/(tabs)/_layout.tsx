import { HapticTab } from '@/components/haptic-tab';
import { getRoleFlags } from '@/src/lib/roles';
import { useAuthStore } from '@/src/stores/auth.store';
import { useMessagerieStore } from '@/src/stores/messagerie.store';
import { useUserStore } from '@/src/stores/user.store';
import { colors, radius, spacing, typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Composants Header Globaux ────────────────────────────────────────────────

function HeaderBrand() {
  return (
    <View style={hStyles.logoRow}>
      <View style={hStyles.iconWrap}>
        <Ionicons name="home" size={14} color={colors.white} />
      </View>
      <Text style={hStyles.brandName}>Anoventix</Text>
    </View>
  );
}

const hStyles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.3,
  },
});

export default function TabLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { profile } = useUserStore();
  const { conversations } = useMessagerieStore();
  const { bottom } = useSafeAreaInsets();
  const roles = profile?.roles ?? user?.roles;
  const { isParticulier, isAgentProfessionnel, isProfessionnel } = getRoleFlags(roles, profile?.type ?? null);

  const unreadCount = isAuthenticated
    ? conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
    : 0;

  const TAB_HEIGHT = 56;
  const TAB_PADDING_BOTTOM = 8;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: true,
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: colors.textPrimary },
        headerTitleAlign: 'center',
        headerLeft: () => <HeaderBrand />,
        tabBarStyle: {
              backgroundColor: colors.white,
              borderTopWidth: 0,
              shadowColor: '#1A3C6E',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 12,
              height: TAB_HEIGHT + bottom,
              paddingBottom: TAB_PADDING_BOTTOM + bottom,
              paddingTop: 6,
            },
        tabBarLabelStyle: { fontSize: typography.sizes.xs, fontWeight: '600', letterSpacing: 0.1 },
        tabBarButton: HapticTab,
      }}>
      {/* index est caché — simple redirect vers explore */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
      {/* Onglet public — accessible sans authentification */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Annonces',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      {/* Messagerie — usage central pour les professionnels */}
      <Tabs.Screen
        name="messagerie"
        options={{
          href: isAuthenticated && (isAgentProfessionnel || isProfessionnel) ? undefined : null,
          title: 'Messagerie',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <View>
              <Ionicons name="chatbubbles-outline" size={24} color={color} />
              {unreadCount > 0 && (
                <View style={bStyles.badge}>
                  <Text style={bStyles.badgeText}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      {/* Favoris — visible uniquement pour les particuliers authentifiés */}
      <Tabs.Screen
        name="favoris"
        options={{
          href: isAuthenticated && !isAgentProfessionnel ? undefined : null,
          title: isProfessionnel ? 'Entreprise' : 'Favoris',
          headerTitle: isProfessionnel ? 'Mon entreprise' : 'Mes favoris',
          tabBarIcon: ({ color }) => (
            <Ionicons
              name={isProfessionnel ? 'business-outline' : 'heart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Publier — visible uniquement si authentifié */}
      <Tabs.Screen
        name="publier"
        options={{
          href: isAuthenticated ? undefined : null,
          title: 'Publier',
          headerTitle: 'Publier une annonce',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={24} color={color} />,
        }}
      />
      {/* Mes annonces — visible uniquement pour les agents pro */}
      <Tabs.Screen
        name="mes-annonces"
        options={{
          href: isAuthenticated && isAgentProfessionnel ? undefined : null,
          title: 'Mes annonces',
          tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={24} color={color} />,
        }}
      />
      {/* Profil — pointe vers login si non authentifié, profil sinon */}
      <Tabs.Screen
        name="profile"
        options={{
          href: isAuthenticated ? undefined : '/(auth)/login',
          title: isAuthenticated ? 'Profil' : 'Connexion',
          headerTitle: isAuthenticated ? 'Mon profil' : 'Connexion',
          tabBarIcon: ({ color }) => {
            const showBadge = unreadCount > 0 && !(isAgentProfessionnel || isProfessionnel);
            return (
              <View>
                <Ionicons
                  name={isAuthenticated ? 'person-outline' : 'log-in-outline'}
                  size={24}
                  color={color}
                />
                {showBadge && (
                  <View style={bStyles.badge}>
                    <Text style={bStyles.badgeText}>
                      {unreadCount > 99 ? '99+' : String(unreadCount)}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        }}
      />
    </Tabs>
  );
}

const bStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 12,
  },
});
