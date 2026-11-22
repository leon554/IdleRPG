import { createStore } from "@/lib/store";
import { request } from "@/lib/api-service-layer/util";
import { isApiError } from "@/lib/api-service-layer/errors";
import type { ActiveTask, RecipeInput } from "@idlerpg/shared";
import type { ClaimResult } from "@idlerpg/shared";
import { refresh } from "./refresh";

type TaskState = {
    activeTask: ActiveTask | null;
    status: "idle" | "loading" | "ready" | "error";
    starting: boolean; 
}

export const taskStore = createStore<TaskState>({ activeTask: null, status: "idle", starting: false });

export const loadActiveTask = async () => {
    if (taskStore.getState().status !== "ready") taskStore.setState({ status: "loading" });
    try {
        const task = await request<ActiveTask>("/gamedata/tasks/active-task");
        taskStore.setState({ activeTask: parseDates(task), status: "ready" });
    } catch (error) {
        if (isApiError(error, "no_active_task")) {
            taskStore.setState({ activeTask: null, status: "ready" });
            return;
        }
        taskStore.setState({ status: "error" });
        throw error;
    }
};

const startTask = async (path: string, body: object) => {
    taskStore.setState({ starting: true });
    try {
        await request(path, { method: "POST", body: JSON.stringify(body) });
        await loadActiveTask();
    } catch (error) {
        if (isApiError(error, "task_already_active")) await loadActiveTask().catch(() => {});
        throw error; 
    } finally {
        taskStore.setState({ starting: false });
    }
};

export const startGatherTask = (gatheringGroupId: string, actionIds: string[]) =>
    startTask("/gamedata/tasks/gather", { gatheringGroupId, actionIds });

export const startCraftTask = (recipeId: string, craftCount: number, actionIds: string[], inputs: RecipeInput[]) =>
    startTask("/gamedata/tasks/craft", { recipeId, craftCount, actionIds, inputs });


export const claimTask = async (): Promise<ClaimResult> => {
    taskStore.setState({ status: "loading" });
    try {
        const result = await request<ClaimResult>("/gamedata/tasks/claim", { method: "POST" });
        await refresh("task", "stats");
        return result;
    } finally {
        // Also runs when the request fails, so status never gets stuck on "loading"
        taskStore.setState({ status: "ready" });
    }
};

// Returns the final claim, or null when the task couldn't be claimed (crafting tasks)
export const stopTask = async (): Promise<ClaimResult | null> => {
    taskStore.setState({ status: "loading" });
    try {
        const result = await request<ClaimResult | null>("/gamedata/tasks/stop-task", { method: "POST" });
        await refresh("task", "stats");
        return result;
    } finally {
        taskStore.setState({ status: "ready" });
    }
};

const parseDates = (task: ActiveTask): ActiveTask => ({
    ...task,
    startTime: new Date(task.startTime),
    lastClaimedAt: new Date(task.lastClaimedAt),
});
