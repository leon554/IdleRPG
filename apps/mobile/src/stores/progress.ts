import { createStore } from "@/lib/store";
import { request } from "@/lib/api-service-layer/util";
import type { CategoryProgress } from "@idlerpg/shared";

type ProgressState = {
    // Partial: a category has no entry until the player first gains XP in it
    progress: Partial<Record<string, CategoryProgress>>;
    status: "idle" | "loading" | "ready" | "error";
};

export const progressStore = createStore<ProgressState>({ progress: {}, status: "idle" });

export const loadProgress = async () => {
    if (progressStore.getState().status !== "ready") progressStore.setState({ status: "loading" });
    try {
        const rows = await request<CategoryProgress[]>("/gamedata/progress");
        const progress = Object.fromEntries(rows.map((p) => [p.categoryId, p]));
        progressStore.setState({ progress, status: "ready" });
    } catch (error) {
        progressStore.setState({ status: "error" });
        throw error;
    }
};