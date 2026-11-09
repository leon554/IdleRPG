import { View, Text } from 'react-native'
import React from 'react'
import { Card } from '../primitives/Card'
import Entypo from '@expo/vector-icons/Entypo';
import { router } from 'expo-router';

export default function GoToGatheringCard() {
    return (
        <Card className='flex-row justify-between items-center'
            onPress={() => router.push("/gathering")}
        >
            <Text className='text-textSecondary font-medium'>
                Gathering
            </Text>
           <Entypo name="chevron-right" size={24} className='text-textSecondary'/>
        </Card>
    )
}