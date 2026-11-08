import { View, Text } from 'react-native'
import React from 'react'
import { Screen } from '@/components/primitives/Screen'
import { SignupCard } from '@/components/auth/SignUpCard'

export default function singup() {
    return (
        <Screen scroll className="justify-center">
            <SignupCard/>
        </Screen>
    )
}