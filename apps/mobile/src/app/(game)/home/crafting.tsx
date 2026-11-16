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
import { useStaticGameData } from '@/providers/StaticGameDataProvider'
import { capitliseFirst } from '@/auth/util'

export default function Crafting() {
    const gameData = useStaticGameData()

    return (
        <Screen className="gap-4">
            <PageHeader name="Crafting" onPrev={() => router.replace("/(game)/home")}/>
            <FlatList
                data={Object.entries(gameData?.recipes ?? [])}
                keyExtractor={(item) => item[0]}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => {
                    return(
                        <Card className='flex-row items-center justify-between'
                            onPress={() => router.push(`/home/category-recipes/${item[0]}`)}
                        >
                            <Text className='text-textSecondary'>
                                {capitliseFirst(item[0])}
                            </Text>
                            <Entypo name="chevron-right" size={24} className='text-textSecondary'/>
                        </Card>
                    )
                }}
            />
        </Screen>
    )
}
