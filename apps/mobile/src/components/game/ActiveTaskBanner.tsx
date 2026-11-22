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
    const now = useNow()

    useEffect(() => {
        if (!activeTask) return
        if (state === "loading") return
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
            refresh("task")
            toast.error(errorMessage(error));
        }
    };

    const onStop = async () => {
        try {
            const result = await stopTask();
            if (!result || result.items.length === 0) return toast.info("Task stopped")
            toast.success(result.items.map(i => (i.type == "equipment" ? "" : `[${i.resource.itemName}, ${i.rarity.name}, ${i.amount}]`)).join(", "))
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
                                {groupName}
                            </Text>
                            <Text className='text-textMuted text-xs'>
                                {GameDataUtil.formatDuration(now - activeTask.startTime.getTime())}
                            </Text>
                        </View>
                        <ProgressBar
                            value={8 - Math.ceil((8000 - (now - activeTask.lastClaimedAt.getTime()))/1000)}
                            max={7}
                            size="sm"
                            label={`Next Cycle: ${state == "loading" ? "loading...": Math.ceil((8000 - (now - activeTask.lastClaimedAt.getTime()))/1000)}s`}
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