import { Pressable, Text, View } from "react-native";

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
};

// A row of mutually exclusive options, e.g. switching between tabs on a screen
export function SegmentedControl<T extends string>({ options, value, onChange, className = "" }: SegmentedControlProps<T>) {
    return (
        <View className={`flex-row rounded-md border border-border bg-surface p-1 ${className}`}>
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        className={`flex-1 items-center rounded py-1.5 ${selected ? "bg-primary" : "active:bg-surfaceRaised"}`}
                    >
                        <Text className={`text-sm font-medium ${selected ? "text-onPrimary" : "text-textSecondary"}`}>
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
