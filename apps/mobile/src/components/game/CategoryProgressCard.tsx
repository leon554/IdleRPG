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
            <ProgressBar
                value={maxed ? 1 : progress.xp - levelStartXp}
                max={maxed ? 1 : nextLevelXp - levelStartXp}
                size="sm"
                showValue
                label={maxed ? "Max level" : `Lv ${progress.level}`}
                formatValue={(v, m) => `${GameDataUtil.formatCompactNumber(progress.xp)} / ${GameDataUtil.formatCompactNumber(nextLevelXp)} XP`}
            />
        </Card>
    );
}
