import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";
import { TextBox, TextBoxRef } from "../primitives/TextBox";

export function LoginCard() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const passwordRef = useRef<TextBoxRef>(null);

    const handleLogin = () => {
        // TODO: login logic
    };

    return (
        <Card className="gap-4 p-6">
        <View className="gap-1">
            <Text className="text-2xl font-bold text-textPrimary">Welcome back</Text>
            <Text className="text-base text-textSecondary">
                Sign in to continue your adventure
            </Text>
        </View>

        <TextBox
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            // error={emailError}
        />

        <TextBox
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            // error={passwordError}
        />

        <Button
            title="Log in"
            fullWidth
            onPress={handleLogin}
            // loading={isSubmitting}
        />
        </Card>
    );
}