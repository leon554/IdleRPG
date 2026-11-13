import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastHost } from '@/components/primitives/Toast';
import { GameDataProvider } from '@/providers/StaticGameDataProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
