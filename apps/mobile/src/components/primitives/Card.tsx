import { Pressable, PressableProps, View, ViewProps } from "react-native";

type Variant = "default" | "raised" | "outline";

type CardProps = ViewProps & {
    variant?: Variant;
    onPress?: PressableProps["onPress"]; 
    className?: string;
};

const variantStyles: Record<Variant, string> = {
    default: "bg-surface border border-border",
    raised: "bg-surfaceRaised border border-border",
    outline: "bg-transparent border border-borderStrong",
};

export function Card({
    variant = "default",
    onPress,
    className = "",
    children,
    ...rest
}: CardProps) {
    const base = `rounded-md p-4 ${variantStyles[variant]} ${className}`;

    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                onPress={onPress}
                className={`${base} active:bg-surfaceRaised`}
                {...(rest as PressableProps)}
            >
                {children}
            </Pressable>
        );
    }

    return (
        <View className={base} {...rest}>
            {children}
        </View>
    );
}