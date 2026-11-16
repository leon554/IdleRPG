import { useEffect } from "react";
import { Text, View, ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "@/theme";

type Variant = "primary" | "success" | "warning" | "danger" | "info";
type Size = "sm" | "md" | "lg";

type ProgressBarProps = Omit<ViewProps, "children"> & {
    /** Current value. Clamped to [0, max]. */
    value: number;
    /** Value that counts as full. Defaults to 1, so `value` can be a 0–1 fraction. */
    max?: number;
    variant?: Variant;
    size?: Size;
    /** Overrides the variant fill colour, e.g. a rarity colour. */
    color?: string;
    /** Text shown on the left above the bar. */
    label?: string;
    /** Shows a value readout on the right above the bar. */
    showValue?: boolean;
    /** Formats the readout. Defaults to a rounded percentage. */
    formatValue?: (value: number, max: number) => string;
    /** Animation length in ms when `value` changes. 0 disables animation. */
    animationDuration?: number;
    className?: string;
};

// Reanimated's Animated.View isn't registered with NativeWind, so className is ignored on it.
// The fill is styled with plain style props instead.
const fillColors: Record<Variant, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
};

const sizeStyles: Record<Size, { track: string; text: string }> = {
    sm: { track: "h-1.5", text: "text-xs" },
    md: { track: "h-2.5", text: "text-sm" },
    lg: { track: "h-4", text: "text-base" },
};

const defaultFormat = (value: number, max: number) => `${Math.round((value / max) * 100)}%`;

export function ProgressBar({
    value,
    max = 1,
    variant = "primary",
    size = "md",
    color,
    label,
    showValue = false,
    formatValue = defaultFormat,
    animationDuration = 300,
    className = "",
    ...rest
}: ProgressBarProps) {
    const safeMax = max > 0 ? max : 1;
    const clamped = Math.min(Math.max(value, 0), safeMax);
    const percent = (clamped / safeMax) * 100;

    const width = useSharedValue(percent);

    useEffect(() => {
        width.value = animationDuration > 0 ? withTiming(percent, { duration: animationDuration }) : percent;
    }, [percent, animationDuration, width]);

    const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

    const hasHeader = !!label || showValue;

    return (
        <View className={`gap-1 ${className}`} {...rest}>
            {hasHeader && (
                <View className="flex-row items-center justify-between">
                    {label ? (
                        <Text className={`text-textSecondary ${sizeStyles[size].text}`}>{label}</Text>
                    ) : (
                        <View />
                    )}
                    {showValue && (
                        <Text className={`text-textMuted ${sizeStyles[size].text}`}>
                            {formatValue(clamped, safeMax)}
                        </Text>
                    )}
                </View>
            )}
            <View
                accessibilityRole="progressbar"
                accessibilityLabel={label}
                accessibilityValue={{ min: 0, max: safeMax, now: clamped }}
                className={`w-full overflow-hidden rounded-full bg-surfaceRaised ${sizeStyles[size].track}`}
            >
                <Animated.View
                    style={[
                        { height: "100%", borderRadius: 9999, backgroundColor: color ?? fillColors[variant] },
                        fillStyle,
                    ]}
                />
            </View>
        </View>
    );
}
