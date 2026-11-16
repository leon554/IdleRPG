import { request,} from "@/lib/api-service-layer/util";
import { Action, GatheringGroup, Recipe, } from "@idlerpg/shared";
import {createContext, useContext, useEffect, useMemo, useState, type ReactNode,} from "react";
import { useAuth } from "./AuthProvider";
import { toast } from "@/components/primitives/Toast";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { GameDataUtil } from "@/util/game-data-util";

const DEFAULT_RESEND_COOLDOWN_MS = 60 * 1000;

type StaticGameDataContextType = {
    gatheringGroups: GatheringGroup[]
    ggPerCategory: Record<string, GatheringGroup[]>
    loading: boolean,
    recipes: Record<string, Recipe[]>
    actions: Action[]
}; 

const staticGameDataContext = createContext<StaticGameDataContextType | null>(null);

export function StaticGameDataProvider({ children }: { children: ReactNode }) {
    const [loading, setLoading] = useState(true)

    const [gatheringGroups, setGatheringGroups] = useState<GatheringGroup[]>([]);
    const ggPerCategory = useMemo(() => GameDataUtil.getGGPerCategoryMap(gatheringGroups), [gatheringGroups])
    
    const [recipes, setRecipes] = useState<Record<string, Recipe[]>>({})
    const [actions, setAcions] = useState<Action[]>([])
    
    const auth = useAuth()

   useEffect(() => {
        if (auth.isLoading || !auth.user) return;
        if (!auth.user) {
            setLoading(true);
            return;
        }

        const fetchGG = async () => {
            setLoading(true);   
            try {
                const gg = await request<GatheringGroup[]>("/gamedata/gathering-groups");
                setGatheringGroups(gg);

                const recipeData = await request<Record<string, Recipe[]>>("/gamedata/recipes");
                setRecipes(recipeData)

                const actionData = await request<Action[]>("/gamedata/actions");
                setAcions(actionData)
            } catch (error) {
                toast.error(errorMessage(error));
            } finally {
                setLoading(false);
            }
        };

        fetchGG();
    }, [auth.isLoading, auth.user]);

    const value = useMemo(
        () => ({ gatheringGroups, ggPerCategory, loading, recipes, actions}),
        [gatheringGroups, ggPerCategory, loading, recipes, actions]
    );

    return <staticGameDataContext.Provider value={value}>{children}</staticGameDataContext.Provider>;
}

export function useStaticGameData() {
    const ctx = useContext(staticGameDataContext);
    return ctx;
}