import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "@/theme";
import { ComponentRef } from "react";

type TextBoxProps = TextInputProps & {
    label?: string;
    helperText?: string;
    error?: string;
    className?: string;

    // ── Numeric mode ──────────────────────────────────────────────
    // Shows a number keyboard and only lets numbers be typed.
    numeric?: boolean;
    // Allow a decimal point (default: whole numbers only)
    allowDecimals?: boolean;
    // Clamped to these when the field loses focus. A min below 0 also allows typing "-".
    min?: number;
    max?: number;
    // Called with the parsed number on every change, or null while the field is empty / just "-" or "."
    onChangeNumber?: (value: number | null) => void;
};
export type TextBoxRef = ComponentRef<typeof TextInput>;

// Keeps only what a number can contain: digits, one "." (if allowed), and a leading "-" (if allowed)
function sanitizeNumber(text: string, allowDecimals: boolean, allowNegative: boolean) {
    const negative = allowNegative && text.trimStart().startsWith("-");
    let digits = text.replace(allowDecimals ? /[^0-9.]/g : /[^0-9]/g, "");

    if (allowDecimals) {
        const firstDot = digits.indexOf(".");
        if (firstDot !== -1) {
            digits = digits.slice(0, firstDot + 1) + digits.slice(firstDot + 1).replace(/\./g, "");
        }
    }
    return (negative ? "-" : "") + digits;
}

// "" / "-" / "." / "-." are in-progress input, not numbers yet
function parseNumber(text: string): number | null {
    if (text === "" || text === "-" || text === "." || text === "-.") return null;
    const value = Number(text);
    return Number.isFinite(value) ? value : null;
}

const clamp = (value: number, min?: number, max?: number) =>
    Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));

// "007" -> "7", "-05" -> "-5" (but "0", "0.5" and "-0." stay as typed)
const stripLeadingZeros = (text: string) => text.replace(/^(-?)0+(?=\d)/, "$1");

// Applies min/max while the player types. Typing more digits only moves a number further from 0,
// so a value past max (or below a negative min) can never come back into range: snap it now.
// A value between 0 and a positive min (e.g. "5" on the way to "50" with min 10) may still be
// heading somewhere valid: keep the text, report null until it's in range, and clamp on blur.
function constrainWhileTyping(text: string, min?: number, max?: number): { text: string; value: number | null } {
    const value = parseNumber(text);
    if (value === null) return { text, value: null };

    if (max !== undefined && value > max && value >= 0) return { text: String(max), value: max };
    if (min !== undefined && value < min && value < 0) return { text: String(min), value: min };

    const inRange = (min === undefined || value >= min) && (max === undefined || value <= max);
    return { text, value: inRange ? value : null };
}

export const TextBox = forwardRef<TextBoxRef, TextBoxProps>(function TextBox(
  {
    label, helperText, error, secureTextEntry, editable = true, className = "",
    numeric = false, allowDecimals = false, min, max, onChangeNumber,
    onChangeText, onBlur, keyboardType, inputMode,
    ...rest
  },
  ref
) {
    const [hidden, setHidden] = useState(true);
    const isPassword = !!secureTextEntry;
    const hasError = !!error;

    const handleChangeText = (text: string) => {
        if (!numeric) return onChangeText?.(text);

        const cleaned = stripLeadingZeros(sanitizeNumber(text, allowDecimals, min !== undefined && min < 0));
        const constrained = constrainWhileTyping(cleaned, min, max);
        onChangeText?.(constrained.text);
        onChangeNumber?.(constrained.value);
    };

    const handleBlur: TextInputProps["onBlur"] = (e) => {
        if (numeric) {
            const current = parseNumber(sanitizeNumber(String(rest.value ?? ""), allowDecimals, min !== undefined && min < 0));
            if (current !== null) {
                const clamped = clamp(current, min, max);
                if (clamped !== current || String(clamped) !== String(rest.value)) {
                    onChangeText?.(String(clamped));
                    onChangeNumber?.(clamped);
                }
            }
        }
        onBlur?.(e);
    };

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
                keyboardType={keyboardType ?? (numeric ? (allowDecimals ? "decimal-pad" : "number-pad") : undefined)}
                inputMode={inputMode ?? (numeric ? (allowDecimals ? "decimal" : "numeric") : undefined)}
                onChangeText={handleChangeText}
                onBlur={handleBlur}
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
