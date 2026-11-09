import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";
import { TextBox, TextBoxRef } from "../primitives/TextBox";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "../primitives/Toast";
import { errorMessage } from "@/lib/api-service-layer/errors";

export function LoginCard() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const passwordRef = useRef<TextBoxRef>(null);

    const auth = useAuth()

    const handleLogin = async () => {
        try {
            await auth.login(email, password)
            toast.success("Success")
        } catch (error) {
            toast.error(errorMessage(error))
        }
    };

    return (
        <Card className="gap-4 p-6 w-[80%]">
            <View className="gap-1 items-center">
                <Text className="text-2xl font-bold text-textPrimary">Welcome back</Text>
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
            />

            <Button
                title="Log in"
                fullWidth
                onPress={handleLogin}
            />
        </Card>
    );
}