import { useEffect } from "react";
import { AppState } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/components/primitives/Toast";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { refreshAll, resetAllStores } from "@/stores/refresh";
import { loadStaticData } from "@/stores/staticData";

export function GameBootstrap() {
    const auth = useAuth();
    const loggedIn = !auth.isLoading && !!auth.user;

    useEffect(() => {
        if (auth.isLoading) return;
        if (!auth.user) {
            resetAllStores();
            return;
        }
        loadStaticData().catch((error) => toast.error(errorMessage(error)));
        refreshAll().catch((error) => toast.error(errorMessage(error)));
    }, [auth.isLoading, auth.user]);

    useEffect(() => {
        if (!loggedIn) return;
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") refreshAll().catch(() => {});
        });
        return () => sub.remove();
    }, [loggedIn]);

    return null;
}
