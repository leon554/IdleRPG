import { Screen } from '@/components/primitives/Screen'
import PageHeader from '@/components/primitives/PageHeader'
import GoToGatheringCard from '@/components/game/GoToGatheringCard'

export default function Home() {
    return (
        <Screen className='gap-4'>
            <PageHeader name='Home'/>
            <GoToGatheringCard/>
        </Screen>
    )
}