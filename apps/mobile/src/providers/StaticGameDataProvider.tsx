import { request,} from "@/lib/api-service-layer/util";
import { GatheringGroup, } from "@idlerpg/shared";
import {createContext, useContext, useEffect, useMemo, useState, type ReactNode,} from "react";
import { useAuth } from "./AuthProvider";
import { toast } from "@/components/primitives/Toast";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { GameDataUtil } from "@/util/game-data-util";

const DEFAULT_RESEND_COOLDOWN_MS = 60 * 1000;

type GameDataContextType = {
    gatheringGroups: GatheringGroup[]
    ggPerCategory: Record<string, GatheringGroup[]>
    loading: boolean
}; 

const gameDataContext = createContext<GameDataContextType | null>(null);

export function GameDataProvider({ children }: { children: ReactNode }) {
    const [gatheringGroups, setGatheringGroups] = useState<GatheringGroup[]>([]);
    const [loading, setLoading] = useState(true)
    const ggPerCategory = useMemo(() => GameDataUtil.getGGPerCategoryMap(gatheringGroups), [gatheringGroups])

    const auth = useAuth()

   useEffect(() => {
        if (auth.isLoading || !auth.user) return;

        const fetchGG = async () => {
            setLoading(true);
            try {
                const gg = await request<GatheringGroup[]>("/gamedata/gathering-groups");
                setGatheringGroups(gg);
            } catch (error) {
                toast.error(errorMessage(error));
            } finally {
                setLoading(false);
            }
        };

        fetchGG();
    }, [auth.isLoading, auth.user]);

    const value = useMemo(
        () => ({ gatheringGroups, ggPerCategory, loading }),
        [gatheringGroups, ggPerCategory, loading]
    );

    return <gameDataContext.Provider value={value}>{children}</gameDataContext.Provider>;
}

export function useGameData() {
    const ctx = useContext(gameDataContext);
    return ctx;
}