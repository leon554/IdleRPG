import { View, Text } from 'react-native'
import React from 'react'
import EmailVerificationCard from '@/components/auth/EmailVerificationCard'
import { Screen } from '@/components/primitives/Screen'

export default function VerifyEmail() {
    return (
       <Screen scroll className="justify-center items-center">
           <EmailVerificationCard/>
       </Screen>
    )
}