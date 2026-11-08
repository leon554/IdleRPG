import { ActivityIndicator, Pressable, PressableProps, Text, View } from "react-native";
import { colors } from "@/theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = Omit<PressableProps, "children"> & {
    title: string;
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    className?: string;
};

const containerStyles: Record<Variant, string> = {
    primary: "bg-primary active:bg-primary/80",
    secondary: "bg-surfaceRaised border border-border active:bg-border",
    outline: "bg-transparent border border-borderStrong active:bg-surfaceRaised",
    ghost: "bg-transparent active:bg-surfaceRaised",
    danger: "bg-danger active:bg-danger/80",
};

const textStyles: Record<Variant, string> = {
    primary: "text-onPrimary",
    secondary: "text-textPrimary",
    outline: "text-textPrimary",
    ghost: "text-primary",
    danger: "text-background",
};

const spinnerColor: Record<Variant, string> = {
    primary: colors.onPrimary,
    secondary: colors.textPrimary,
    outline: colors.textPrimary,
    ghost: colors.primary,
    danger: colors.background,
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
    sm: { container: "px-3 py-1.5 rounded-md", text: "text-sm" },
    md: { container: "px-4 py-3 rounded-md", text: "text-base" },
    lg: { container: "px-6 py-4 rounded-md", text: "text-lg" },
};

export function Button({ title, variant = "primary", size = "md", loading = false,fullWidth = false, leftIcon, disabled,className = "", ...rest}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            className={[
                "flex-row items-center justify-center gap-2",
                containerStyles[variant],
                sizeStyles[size].container,
                fullWidth ? "w-full" : "self-start",
                isDisabled ? "opacity-50" : "",
                className,
            ].join(" ")}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator size="small" color={spinnerColor[variant]} />
            ) : (
                leftIcon && <View>{leftIcon}</View>
            )}
            <Text className={`font-semibold ${textStyles[variant]} ${sizeStyles[size].text}`}>
                {title}
            </Text>
        </Pressable>
    );
}