import { createStore } from "@/lib/store";
import { request } from "@/lib/api-service-layer/util";
import type { CategoryStats } from "@idlerpg/shared";

type StatsState = {
    stats: Record<string, CategoryStats>;
    status: "idle" | "loading" | "ready" | "error";
};

export const statsStore = createStore<StatsState>({ stats: {}, status: "idle" });

export const loadStats = async () => {
    statsStore.setState({ status: "loading" });
    try {
        const stats = await request<Record<string, CategoryStats>>("/gamedata/stats");
        statsStore.setState({ stats, status: "ready" });
    } catch (error) {
        statsStore.setState({ status: "error" });
        throw error;
    }
};
