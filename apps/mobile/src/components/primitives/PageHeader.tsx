import { View, Text } from 'react-native'
import React from 'react'
import { Card } from './Card'


interface Props {
    name: string
}
export default function PageHeader({name}: Props) {
    return (
        <Card className='items-center'>
            <Text className='text-xl font-bold text-textPrimary '>
                {name}
            </Text>
        </Card>
    )
}