import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import type { ColorValue } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { taskStore } from '@/stores/task';
import { Card } from '@/components/primitives/Card';
import { useNow } from '@/hooks/useNow';
import { GameDataUtil } from '@/util/game-data-util';
import { claimTask } from '@/stores/task';
import { errorMessage } from '@/lib/api-service-layer/errors';
import { toast } from '@/components/primitives/Toast';
import { useEffect } from 'react';

function iconColor(color: ColorValue | null) {
    return typeof color === 'string' ? color : colors.textMuted;
}

const tabIcon =
    (name: React.ComponentProps<typeof FontAwesome>['name']) =>
    ({ color }: { color: ColorValue | null }) =>
        <FontAwesome name={name} color={iconColor(color)} size={22} />;


function ActiveTaskBanner() {
    const activeTask = useStore(taskStore, (s) => s.activeTask);
    const state = useStore(taskStore, (s) => s.status);
    const now = useNow()

    useEffect(() => {
        if (!activeTask) return
        if(now - activeTask.lastClaimedAt.getTime() > 8000){
            onClaim()
        }
    }, [now])

    if (!activeTask) return null;

    const onClaim = async () => {
        try {
            const result = await claimTask();
            if (result.cyclesClaimed === 0) return toast.info("Nothing to claim yet");
            toast.success(result.items.map(i => (i.type == "equipment" ? "" : `[${i.resource.itemName}, ${i.rarity.name}, ${i.amount}]`)).join(", "))
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };



    return (
        <View className="px-2 pb-2" style={{ backgroundColor: colors.background }}>
            <Card>
                <Text className="text-textPrimary">
                    {activeTask.gatheringGroupId}
                </Text>
                <Text className='text-textMuted'>
                    {GameDataUtil.formatDuration(now - activeTask.startTime.getTime())}
                </Text>
                <Text className='text-textMuted'>
                    Next Cycle: {state == "loading" ? "loading...": Math.ceil((8000 - (now - activeTask.lastClaimedAt.getTime()))/1000)}
                </Text>
            </Card>
        </View>
    );
}

function TabBarWithBanner(props: BottomTabBarProps) {
    return (
        <View>
            <ActiveTaskBanner />
            <BottomTabBar {...props} />
        </View>
    );
}

export default function GameLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            tabBar={(props) => <TabBarWithBanner {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: colors.background },
                popToTopOnBlur: true,
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
            <Tabs.Screen name="home"
                options={{ title: 'Home', tabBarIcon: tabIcon('home') }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        if (navigation.isFocused()) {
                            e.preventDefault();
                            router.dismissTo('/home');
                        }
                    },
                })}
                />
            <Tabs.Screen name="inventory" options={{ title: 'Inventory', tabBarIcon: tabIcon('archive') }} />
            <Tabs.Screen name="market" options={{ title: 'Market', tabBarIcon: tabIcon('shopping-cart') }} />
            <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: tabIcon('bolt') }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('cog') }} />
        </Tabs>
    );
}
