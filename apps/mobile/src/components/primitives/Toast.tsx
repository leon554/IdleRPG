import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "warning" | "info";
type ToastOptions = { duration?: number };
type ToastMessage = React.ReactNode;

export const toast = {
    show: (message: ToastMessage, opts?: ToastOptions) => emit("info", message, opts),
    info: (message: ToastMessage, opts?: ToastOptions) => emit("info", message, opts),
    success: (message: ToastMessage, opts?: ToastOptions) => emit("success", message, opts),
    warning: (message: ToastMessage, opts?: ToastOptions) => emit("warning", message, opts),
    error: (message: ToastMessage, opts?: ToastOptions) => emit("error", message, opts),
};

type ToastItem = { id: number; type: ToastType; message: ToastMessage; duration: number };

type Listener = (t: ToastItem) => void;
const listeners: Listener[] = [];
let nextId = 1;

function emit(type: ToastType, message: ToastMessage, opts?: ToastOptions) {
    listeners[listeners.length - 1]?.({ id: nextId++, type, message, duration: opts?.duration ?? 3000 });
}

const HIDDEN_Y = -140;


const VARIANTS: Record<ToastType, { icon: string; badge: string }> = {
    success: { icon: "✓", badge: "bg-success" },
    error: { icon: "✕", badge: "bg-danger" },
    warning: { icon: "!", badge: "bg-warning" },
    info: { icon: "i", badge: "bg-info" },
};


export function ToastHost({ active = true }: { active?: boolean } = {}) {
    const insets = useSafeAreaInsets();
    const [item, setItem] = useState<ToastItem | null>(null);
    const y = useRef(new Animated.Value(HIDDEN_Y)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const showing = useRef<ToastItem | null>(null);

    const hide = useCallback(() => {
        clearTimeout(timer.current);
        showing.current = null;
        Animated.parallel([
            Animated.timing(y, { toValue: HIDDEN_Y, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(({ finished }) => {
            if (finished) setItem(null);
        });
    }, [y, opacity]);

    useEffect(() => {
        if (!active) return;
        const listener: Listener = (t) => {
            clearTimeout(timer.current);
            showing.current = t;
            setItem(t); 
            Animated.parallel([
                Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
                Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            ]).start();
            timer.current = setTimeout(hide, t.duration);
        };
        listeners.push(listener);
        return () => {
            const index = listeners.lastIndexOf(listener);
            if (index !== -1) listeners.splice(index, 1);
            clearTimeout(timer.current);
            const pending = showing.current;
            showing.current = null;
            setItem(null);
            if (pending) listeners[listeners.length - 1]?.(pending);
        };
    }, [active, hide, y, opacity]);

    if (!item) return null;
    const v = VARIANTS[item.type];

    return (

        <Animated.View
            pointerEvents="box-none"
            style={{
                position: "absolute",
                top: insets.top + 8,
                left: 16,
                right: 16,
                zIndex: 9999,
                elevation: 9999,
                opacity,
                transform: [{ translateY: y }],
            }}
        >
            <Pressable
                onPress={hide}
                className="flex-row items-center rounded-md border border-border bg-surfaceRaised px-3.5 py-3 active:opacity-80"
                style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                }}
            >
                <View className={`mr-3 h-6 w-6 items-center justify-center rounded-full ${v.badge}`}>
                    <Text className="text-sm font-bold text-background">{v.icon}</Text>
                </View>
                {typeof item.message === "string" || typeof item.message === "number" ? (
                    <Text className="flex-1 text-[15px] font-medium text-textPrimary" numberOfLines={3}>
                        {item.message}
                    </Text>
                ) : (
                    <View className="flex-1">{item.message}</View>
                )}
            </Pressable>
        </Animated.View>
    );
}