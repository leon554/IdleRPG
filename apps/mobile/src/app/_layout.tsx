import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastHost } from '@/components/primitives/Toast';
import { StaticGameDataProvider } from '@/providers/StaticGameDataProvider';
import { GameDataProvider } from '@/providers/GameDataProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StaticGameDataProvider>
        <GameDataProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          <ToastHost />
          <StatusBar style="light" />
        </GameDataProvider>
      </StaticGameDataProvider>
    </AuthProvider>
  );
}
