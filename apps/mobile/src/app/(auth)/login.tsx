import { View, Text } from 'react-native'
import React from 'react'
import { Screen } from '@/components/primitives/Screen'
import { LoginCard } from '@/components/auth/LoginCard'

export default function login() {
    return (
       <Screen scroll className="justify-center items-center">
            <LoginCard/>
       </Screen>
    )
}