import { Text, View } from 'react-native';
import { Card } from '@/components/primitives/Card';
import { ProgressBar } from '@/components/primitives/ProgressBar';
import { useStore } from '@/lib/store';
import { progressStore } from '@/stores/progress';
import { GameDataUtil } from '@/util/game-data-util';
import { MAX_LEVEL, xpForLevel } from '@idlerpg/shared/src/gameData';

export function CategoryProgressCard({ categoryId }: { categoryId: string }) {
    const progress = useStore(progressStore, (p) => p.progress[categoryId]) ?? { categoryId, level: 1, xp: 0 };

    const levelStartXp = xpForLevel(progress.level);
    const nextLevelXp = xpForLevel(progress.level + 1);
    const maxed = progress.level >= MAX_LEVEL;

    return (
        <Card className="gap-2">
            <View className="flex-row justify-between items-center">
                <Text className="text-textPrimary font-semibold">Level {progress.level}</Text>
                <Text className="text-textMuted text-xs">{GameDataUtil.formatCompactNumber(progress.xp)} XP</Text>
            </View>
            <ProgressBar
                value={maxed ? 1 : progress.xp - levelStartXp}
                max={maxed ? 1 : nextLevelXp - levelStartXp}
                size="sm"
                label={maxed ? "Max level" : `Next level In: ${GameDataUtil.formatCompactNumber(nextLevelXp - progress.xp)} XP`}
            />
        </Card>
    );
}
