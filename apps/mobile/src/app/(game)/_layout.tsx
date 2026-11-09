import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import type { ColorValue } from 'react-native';

function iconColor(color: ColorValue | null) {
    return typeof color === 'string' ? color : colors.textMuted;
}

const tabIcon =
    (name: React.ComponentProps<typeof FontAwesome>['name']) =>
    ({ color }: { color: ColorValue | null }) =>
        <FontAwesome name={name} color={iconColor(color)} size={22} />;

export default function GameLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: colors.background },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    height: 88 + insets.bottom,
                    paddingTop: 8,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    elevation: 0, 
                },
                tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
            }}
        >
            <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
            <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: tabIcon('bolt') }} />
            <Tabs.Screen name="inventory" options={{ title: 'Inventory', tabBarIcon: tabIcon('archive') }} />
            <Tabs.Screen name="market" options={{ title: 'Market', tabBarIcon: tabIcon('shopping-cart') }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('cog') }} />
        </Tabs>
    );
}