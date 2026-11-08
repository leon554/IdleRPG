import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../primitives/Button";
import { Card } from "../primitives/Card";
import { TextBox, TextBoxRef } from "../primitives/TextBox";

export function SignupCard() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const emailRef = useRef<TextBoxRef>(null);
  const passwordRef = useRef<TextBoxRef>(null);
  const confirmRef = useRef<TextBoxRef>(null);

  const handleSignup = () => {
    // TODO: signup logic
  };

  return (
        <Card className="gap-4 p-6">
            <View className="gap-1 items-center font-mono">
                <Text className="text-2xl font-bold text-textPrimary font-mono">Create account</Text>
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
                // error={usernameError}
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
                // error={emailError}
            />

            <TextBox
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                helperText="At least 8 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                // error={passwordError}
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
                // error={confirmError}
            />

            <Button
                title="Sign up"
                fullWidth
                onPress={handleSignup}
                // loading={isSubmitting}
            />
        </Card>
    );
}