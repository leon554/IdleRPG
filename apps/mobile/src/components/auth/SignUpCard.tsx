import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";
import { TextBox, TextBoxRef } from "../primitives/TextBox";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "../primitives/Toast";
import { errorMessage, isApiError } from "@/lib/api-service-layer/errors";

export function SignupCard() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false)

    const emailRef = useRef<TextBoxRef>(null);
    const passwordRef = useRef<TextBoxRef>(null);
    const confirmRef = useRef<TextBoxRef>(null);

    const authContext = useAuth()

    const handleSignup = async () => {
        try {
            await authContext.signUp(username, email, password)
            toast.success("Signed Up, Check email for confirmation code", {duration: 2000})
        } catch (error) {
            toast.error(errorMessage(error))
        }
    };

    return (
        <Card className="gap-4 p-6 w-[80%] ">
            <View className="gap-1 items-center  o">
                <Text className="text-2xl font-bold text-textPrimary  o">Create account</Text>
            </View>

            <TextBox
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a username"
                autoCapitalize="none"
                autoComplete="username-new"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
            />

            <TextBox
                ref={emailRef}
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
                placeholder="Create a password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
            />

            <TextBox
                ref={confirmRef}
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
            />

            <Button
                title="Sign up"
                fullWidth
                onPress={handleSignup}
                loading={loading}
            />
        </Card>
    );
}