import { Text, View } from "react-native";
import type { CategoryStats } from "@idlerpg/shared";
import { GameDataUtil } from "@/util/game-data-util";

const STAT_LABELS: Record<keyof CategoryStats, string> = {
    progress: "Progress",
    quality: "Quality",
    yield: "Yield",
    gatheringPoints: "GP",
};
const STAT_KEYS = Object.keys(STAT_LABELS) as (keyof CategoryStats)[];

export function StatList({ stats, compareTo }: { stats: CategoryStats; compareTo?: CategoryStats }) {
    const diff = compareTo ? GameDataUtil.statDiff(stats, compareTo) : null;
    const keys = diff ? STAT_KEYS.filter((k) => diff[k] !== 0) : STAT_KEYS;

    if (diff && keys.length === 0) return <Text className="text-xs text-textMuted">No change</Text>;

    return (
        <View className="flex-row flex-wrap gap-1.5">
            {keys.map((key) => {
                const value = diff ? diff[key] : stats[key];
                const color = !diff ? "text-textSecondary" : value > 0 ? "text-success" : "text-danger";
                return (
                    <Text key={key} className={`text-xs ${color}`}>
                        {STAT_LABELS[key]} {diff && value > 0 ? "+" : ""}{GameDataUtil.roundToSignificant(value, 3)}
                    </Text>
                );
            })}
        </View>
    );
}
