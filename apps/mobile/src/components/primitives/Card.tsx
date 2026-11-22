import { Pressable, PressableProps, Text, View, ViewProps } from "react-native";

// "none": no background, border, rounding, padding or pressed highlight; only your className applies
type Variant = "default" | "raised" | "outline" | "none";

type CardProps = ViewProps & {
    variant?: Variant;
    onPress?: PressableProps["onPress"]; 
    label?: string;
    className?: string;
};

const variantStyles: Record<Variant, string> = {
    default: "bg-surface border border-border",
    raised: "bg-surfaceRaised border border-border",
    outline: "bg-transparent border border-borderStrong",
    none: "",
};

export function Card({
    variant = "default",
    onPress,
    label,
    className = "",
    children,
    ...rest
}: CardProps) {
    const unstyled = variant === "none";
    const base = unstyled ? className : ` ${className} rounded-md p-4 ${variantStyles[variant]}`;

    const content = (
        <>
            {label ? (
                <Text accessibilityRole="header" className="text-textPrimary text-base font-semibold">
                    {label}
                </Text>
            ) : null}
            {children}
        </>
    );

    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                onPress={onPress}
                className={unstyled ? base : `${base} active:bg-surfaceRaised`}
                {...(rest as PressableProps)}
            >
                {content}
            </Pressable>
        );
    }

    return (
        <View className={base} {...rest}>
            {content}
        </View>
    );
}