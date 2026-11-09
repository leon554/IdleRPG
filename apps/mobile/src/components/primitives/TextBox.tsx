import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "@/theme";
import { ComponentRef } from "react";

type TextBoxProps = TextInputProps & {
    label?: string;
    helperText?: string;
    error?: string;
    className?: string; 
};
export type TextBoxRef = ComponentRef<typeof TextInput>;

export const TextBox = forwardRef<TextBoxRef, TextBoxProps>(function TextBox(
  { label, helperText, error, secureTextEntry, editable = true, className = "", ...rest },
  ref
) {
    const [hidden, setHidden] = useState(true);
    const isPassword = !!secureTextEntry;
    const hasError = !!error;

    return (
        <View className={`w-full gap-1.5 ${className}`}>
        {label && (
            <Text className="text-sm font-medium text-textSecondary  o">{label}</Text>
        )}

        <View className="justify-center  o">
            <TextInput
                ref={ref}
                editable={editable}
                secureTextEntry={isPassword && hidden}
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
                cursorColor={colors.primary}
                accessibilityLabel={label}
                accessibilityState={{ disabled: !editable }}
                className={[
                    "rounded-md border bg-surface px-4 py-3  text-textPrimary outline-none  o",
                    hasError
                    ? "border-danger focus:border-danger"
                    : "border-borderStrong focus:border-primary",
                    isPassword ? "pr-16" : "",
                    editable ? "" : "opacity-50",
                ].join(" ")}
                {...rest}
            />

            {isPassword && (
            <Pressable
                onPress={() => setHidden((h) => !h)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={hidden ? "Show password" : "Hide password"}
                className="absolute right-4"
            >
                <Text className="text-sm font-medium text-primary">
                    {hidden ? "Show" : "Hide"}
                </Text>
            </Pressable>
            )}
        </View>

        {hasError ? (
            <Text className="text-sm text-danger">{error}</Text>
        ) : helperText ? (
            <Text className="text-sm text-textMuted  o">{helperText}</Text>
        ) : null}
        </View>
    );
});