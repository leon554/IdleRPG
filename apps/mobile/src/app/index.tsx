import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { HealthResponse } from '@idlerpg/shared';
import { API_URL, getHealth } from '@/lib/api';

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setError(null);
    try {
      setHealth(await getHealth());
    } catch (e) {
      setHealth(null);
      setError(e instanceof Error ? e.message : 'Request failed');
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Text className="text-4xl font-bold text-primary">IdleRPG</Text>

        <View className="w-full rounded-2xl border border-border bg-surface p-5">
          <Text className="mb-2 text-sm text-textMuted">API: {API_URL}</Text>
          {health ? (
            <Text className={health.status === 'ok' ? 'text-success' : 'text-danger'}>
              Status: {health.status} | DB: {health.db}
            </Text>
          ) : (
            <Text className="text-danger">{error ?? 'Checking...'}</Text>
          )}
        </View>

        <Pressable onPress={check} className="rounded-xl bg-primary px-6 py-3 active:bg-surfaceRaised">
          <Text className="font-semibold text-onPrimary">Check again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
