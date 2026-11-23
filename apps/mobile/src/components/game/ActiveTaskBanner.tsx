import { useStore } from "@/lib/store";
import { useNow } from "@/hooks/useNow";
import { useEffect } from "react";
import { taskStore } from "@/stores/task";
import { claimTask, stopTask } from "@/stores/task";
import { toast } from "../primitives/Toast";
import { refresh } from "@/stores/refresh";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { View, Text } from "react-native";
import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";
import { colors } from "@/theme";
import { GameDataUtil } from "@/util/game-data-util";
import { staticDataStore } from "@/stores/staticData";
import { ProgressBar } from "../primitives/ProgressBar";

export function ActiveTaskBanner() {
    const activeTask = useStore(taskStore, (s) => s.activeTask);
    const state = useStore(taskStore, (s) => s.status);
    const groupName = useStore(staticDataStore, (s) => s.gatheringGroups.find((g) => g.id === activeTask?.gatheringGroupId)?.name);
    const taskName = activeTask?.taskType === "crafting" ? activeTask.recipe.name : groupName;
    const now = useNow()
    // Time into the current cycle; each task has its own cycle length (base time + its actions' delays)
    const elapsedMs = activeTask ? now - activeTask.lastClaimedAt.getTime() : 0
    const remainingSeconds = activeTask ? Math.max(0, Math.ceil((activeTask.cycleMs - elapsedMs) / 1000)) : 0

    useEffect(() => {
        if (!activeTask) return
        if (state === "loading") return
        if(elapsedMs > activeTask.cycleMs){
            onClaim()
        }
    }, [now])

    if (!activeTask) return null;

    const onClaim = async () => {
        try {
            const result = await claimTask();
            if (result.cyclesClaimed === 0) return toast.info("Nothing to claim yet");
            toast.success(result.items.map(i => `[${i.type == "equipment" ? i.equipment.name : i.resource.itemName}, ${i.rarity.name}, ${i.amount}]`).join(", "))
        } catch (error) {
            refresh("task")
            toast.error(errorMessage(error));
        }
    };

    const onStop = async () => {
        try {
            const result = await stopTask();
            if (!result || result.items.length === 0) return toast.info("Task stopped")
            toast.success(result.items.map(i => `[${i.type == "equipment" ? i.equipment.name : i.resource.itemName}, ${i.rarity.name}, ${i.amount}]`).join(", "))
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };



    return (
        <View className="px-2 pb-2" style={{ backgroundColor: colors.background }}>
            <Card className="p-3">
                <View className="flex-row justify-between items-center">
                    <View className="gap-1  w-[80%]">
                        <View className="flex-row items-center gap-3">
                            <Text className="text-textPrimary font-semibold">
                                {taskName}
                            </Text>
                            <Text className='text-textMuted text-xs'>
                                {GameDataUtil.formatDuration(now - activeTask.startTime.getTime())}
                            </Text>
                        </View>
                        <ProgressBar
                            value={Math.min(elapsedMs, activeTask.cycleMs)}
                            max={activeTask.cycleMs}
                            size="sm"
                            label={`Next Cycle: ${state == "loading" ? "loading..." : `${remainingSeconds}s`}`}
                        />
                    </View>
                    <Button
                        title='Stop'
                        size='sm'
                        className="self-center"
                        onPress={() => onStop()}
                    />
                </View>
            </Card>
        </View>
    );
}