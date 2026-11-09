import { View, Text } from 'react-native'
import React from 'react'
import { Screen } from '@/components/primitives/Screen'
import LogoutCard from '@/components/game/LogoutCard'
import PageHeader from '@/components/primitives/PageHeader'

export default function settings() {
    return (
       <Screen className='gap-4'>
            <PageHeader name='Settings'/>
            <LogoutCard/>
       </Screen>
    )
}