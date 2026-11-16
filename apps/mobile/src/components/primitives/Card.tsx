import { Pressable, PressableProps, Text, View, ViewProps } from "react-native";

type Variant = "default" | "raised" | "outline";

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
};

export function Card({
    variant = "default",
    onPress,
    label,
    className = "",
    children,
    ...rest
}: CardProps) {
    const base = `rounded-md p-4 ${variantStyles[variant]} ${className}`;

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
                className={`${base} active:bg-surfaceRaised`}
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