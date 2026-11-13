import { Screen } from '@/components/primitives/Screen'
import PageHeader from '@/components/primitives/PageHeader'
import { useEffect, useMemo, useState } from 'react'
import { GatheringGroup } from '@idlerpg/shared'
import { request } from '@/lib/api-service-layer/util'
import { toast } from '@/components/primitives/Toast'
import { errorMessage } from '@/lib/api-service-layer/errors'
import { FlatList } from 'react-native'
import { Card } from '@/components/primitives/Card'
import { Text } from "react-native";
import Entypo from '@expo/vector-icons/Entypo';
import { router } from 'expo-router'
import { useGameData } from '@/providers/StaticGameDataProvider'

export default function Gathering() {
    const gameData = useGameData()

    return (
        <Screen className="gap-4">
            <PageHeader name="Gathering" onPrev={() => router.replace("/(game)/home")}/>
            <FlatList
                data={Object.entries(gameData?.ggPerCategory ?? [])}
                keyExtractor={(item) => item[0]}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => {
                    return(
                        <Card className='flex-row items-center justify-between'
                            onPress={() => router.push(`/home/category-gathering-groups/${item[0]}`)}
                        >
                            <Text className='text-textSecondary'>
                                {item[1][0].category}
                            </Text>
                            <Entypo name="chevron-right" size={24} className='text-textSecondary'/>
                        </Card>
                    )
                }}
            />
        </Screen>
    )
}
