import { request } from "@/lib/api-service-layer/util";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "@/components/primitives/Toast";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { useStaticGameData } from "./StaticGameDataProvider";
import { CategoryStats } from "@idlerpg/shared";

type GameDataContextType = {
    stats: Record<string, CategoryStats>;
    loading: boolean;
    refreshStats: () => Promise<void>;
};

const gameDataContext = createContext<GameDataContextType | null>(null);

export function GameDataProvider({ children }: { children: ReactNode }) {
    const staticData = useStaticGameData();
    const staticReady = !!staticData && !staticData.loading;

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Record<string, CategoryStats>>({});

    const refreshStats = useCallback(async () => {
        try {
            const data = await request<Record<string, CategoryStats>>("/gamedata/stats");
            setStats(data);
        } catch (error) {
            toast.error(errorMessage(error));
        }
    }, []);

    useEffect(() => {
        if (!staticReady) return;

        let cancelled = false;

        const fetchGameData = async () => {
            setLoading(true);
            await refreshStats();
            if (!cancelled) setLoading(false);
        };

        fetchGameData();

        return () => {
            cancelled = true;
        };
    }, [staticReady, refreshStats]);

    const value = useMemo(
        () => ({ stats, loading, refreshStats }),
        [stats, loading, refreshStats]
    );

    return <gameDataContext.Provider value={value}>{children}</gameDataContext.Provider>;
}

export function useGameData() {
    const ctx = useContext(gameDataContext);
    if (!ctx) throw new Error("useGameData must be used inside GameDataProvider");
    return ctx;
}