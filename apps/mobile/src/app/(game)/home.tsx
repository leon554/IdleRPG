import { View, Text } from 'react-native'
import React from 'react'
import { Button } from '@/components/primitives/Button'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from '@/components/primitives/Toast'
import { errorMessage } from '@/lib/api-service-layer/errors'

export default function Home() {
    const auth = useAuth()
    const logOut = async () => {
        try {
            await auth.logOut()
            toast.success("Logged Out")
        } catch (error) {
            toast.error(errorMessage(error))
        }
    }
    return (
        <View>
            <Text>Home</Text>
            <Button
                title="Log Out"
                onPress={logOut}
            />
        </View>
    )
}