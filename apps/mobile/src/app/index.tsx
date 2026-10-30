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
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <Text className="text-4xl font-bold text-amber-400">IdleRPG</Text>

        <View className="w-full rounded-2xl bg-slate-800 p-5">
          <Text className="mb-2 text-sm text-slate-400">API: {API_URL}</Text>
          {health ? (
            <Text className={health.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}>
              Status: {health.status} | DB: {health.db}
            </Text>
          ) : (
            <Text className="text-red-400">{error ?? 'Checking...'}</Text>
          )}
        </View>

        <Pressable onPress={check} className="rounded-xl bg-amber-500 px-6 py-3 active:bg-amber-600">
          <Text className="font-semibold text-slate-900">Check again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
