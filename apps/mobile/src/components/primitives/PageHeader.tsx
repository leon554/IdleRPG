import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { Card } from './Card'
import { Button } from './Button'
import Entypo from '@expo/vector-icons/Entypo';

interface Props {
    name: string
    onPrev?: () => void
}
export default function PageHeader({name, onPrev}: Props) {
    return (
        <Card className='items-center flex-row justify-around'>
            {onPrev && 
                <Pressable
                    onPress={() => onPrev()}
                >
                    <Entypo name="chevron-left" size={24} className='text-textSecondary'/>
                </Pressable>
            }
            <Text className='text-xl font-bold text-textPrimary w-full mr-9 text-center'>
                {name}
            </Text>
        </Card>
    )
}