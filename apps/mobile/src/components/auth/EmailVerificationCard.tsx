import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { useState } from 'react';
import { TextBox, TextBoxRef } from '../primitives/TextBox';
import { useRef } from 'react';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '../primitives/Toast';
import { errorMessage } from '@/lib/api-service-layer/errors';

export default function EmailVerificationCard() {
    const [emailCode, setEmailCode] = useState("");

    const auth = useAuth();
    const [resendTime, setResendTime] = useState(() => Math.max(0, Math.ceil((auth.resendAvailableAt - Date.now()) / 1000)));

    useEffect(() => {
        const tick = () => {
            const remaining = Math.max(0, Math.ceil((auth.resendAvailableAt - Date.now()) / 1000));
            setResendTime(remaining);
            return remaining;
        };

        if (tick() === 0) return;

        const id = setInterval(() => {
            if (tick() === 0) clearInterval(id);
        }, 1000);

        return () => clearInterval(id);
    }, [auth.resendAvailableAt]);

    const handleLogin = async () => {
        try {
           await auth.verifyEmail(emailCode)
           toast.success("Email Verified")
        } catch (error) {
            toast.error(errorMessage(error))
        }
    };
    const handleResend = async () => {
        try {
           await auth.resendCode()
           toast.success("Sent new code to your email")
        } catch (error) {
            toast.error(errorMessage(error))
        }
    };

    return (
        <Card className="gap-4 p-6 w-[80%]">
        <View className="gap-1 items-center">
            <Text className="text-2xl font-bold text-textPrimary">Welcome back</Text>
            <Text className="text-sm text-textSecondary">
                Enter the code send to your email
            </Text>
        </View>

        <TextBox
            label="Code"
            value={emailCode}
            onChangeText={setEmailCode}
            placeholder="123456"
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
        />

        <Button
            title="Verify Email"
            fullWidth
            onPress={handleLogin}
        />

        <Button
            title={`Resend Code ${resendTime > 0 ? `(${resendTime}s)` : ""}`}
            variant="secondary"
            fullWidth
            onPress={handleResend}
        />
        </Card>
    );
    
}