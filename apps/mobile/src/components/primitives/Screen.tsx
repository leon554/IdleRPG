import { ScrollView, View, ViewProps } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = ViewProps & {
    scroll?: boolean;
    padded?: boolean;
    edges?: Edge[];
    className?: string;
};

export function Screen({
    children,
    scroll = false,
    padded = true,
    edges = ["top", "bottom", "left", "right"],
    className = "",
    ...rest
}: ScreenProps) {
    const padding = padded ? "px-4 py-4" : "";

    return (
        <SafeAreaView edges={edges} className="flex-1 bg-background">
            {scroll ? (
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName={`grow gap-4 ${padding} ${className}`}
                    {...rest}
                >
                    {children}
                </ScrollView>
            ) : (
                <View className={`flex-1 ${padding} ${className}`} {...rest}>
                    {children}
                </View>
            )}
        </SafeAreaView>
    );
}