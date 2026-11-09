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

export default function Gathering() {
    const [gatheringGroups, setGatheringGroups] = useState<GatheringGroup[]|null>(null)
    const [selectedCategory, setSelectedCategory] = useState("")

    const ggPerCategory = useMemo(() => {
        const map: Map<string, GatheringGroup[]> = new Map()
        gatheringGroups?.forEach(g => {
            const prev = map.get(g.category)
            if(prev){
                prev.push(g)
            }else{
                map.set(g.category, [g])
            }
        })
        return Object.fromEntries(map); 
    }, [gatheringGroups])

    useEffect(() => {
        const fetchGG = async () => {
            try {
                const gg = await request<GatheringGroup[]>("/gamedata/gathering-groups")
                setGatheringGroups(gg)
                toast.success("succes")
            } catch (error) {
                toast.error(errorMessage(error))
            }
        }
        fetchGG()
    }, [])

    return (
        <Screen className="gap-4">
            <PageHeader name="Gathering" />
            <FlatList
                data={Object.entries(ggPerCategory)}
                keyExtractor={(item) => item[0]}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => {
                    return(
                        <Card>
                            <Text className='text-textSecondary'>
                                {item[0]}
                            </Text>
                             <Text className='text-textSecondary'>
                                {JSON.stringify(item[1])}
                            </Text>
                        </Card>
                    )
                }}
            />
        </Screen>
    )
}
