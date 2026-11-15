import { View, Text } from 'react-native'
import React from 'react'
import { Card } from './Card'
import Entypo from '@expo/vector-icons/Entypo';
import { RelativePathString, router } from 'expo-router';

interface GoToCardProps{
    name: string,
    route: string
}
export default function GoToCard({name, route}: GoToCardProps) {
    return (
        <Card className='flex-row justify-between items-center'
            onPress={() => router.push(route as RelativePathString)}
        >
            <Text className='text-textSecondary font-medium'>
                {name}
            </Text>
           <Entypo name="chevron-right" size={24} className='text-textSecondary'/>
        </Card>
    )
}