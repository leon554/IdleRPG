import { createStore } from "@/lib/store";
import { request } from "@/lib/api-service-layer/util";
import type { Action, GatheringGroup, Recipe } from "@idlerpg/shared";
import { GameDataUtil } from "@/util/game-data-util";

type StaticDataState = {
    gatheringGroups: GatheringGroup[];
    ggPerCategory: Record<string, GatheringGroup[]>;
    recipes: Record<string, Recipe[]>;
    actions: Action[];
    status: "idle" | "loading" | "ready" | "error";
};

export const staticDataStore = createStore<StaticDataState>({
    gatheringGroups: [],
    ggPerCategory: {},
    recipes: {},
    actions: [],
    status: "idle",
});

export const loadStaticData = async () => {
    if (staticDataStore.getState().status === "ready") return;

    staticDataStore.setState({ status: "loading" });
    try {
        const [gatheringGroups, recipes, actions] = await Promise.all([
            request<GatheringGroup[]>("/gamedata/gathering-groups"),
            request<Record<string, Recipe[]>>("/gamedata/recipes"),
            request<Action[]>("/gamedata/actions"),
        ]);
        staticDataStore.setState({
            gatheringGroups,
            ggPerCategory: GameDataUtil.getGGPerCategoryMap(gatheringGroups),
            recipes,
            actions,
            status: "ready",
        });
    } catch (error) {
        staticDataStore.setState({ status: "error" });
        throw error;
    }
};
