import { Screen } from '@/components/primitives/Screen'
import PageHeader from '@/components/primitives/PageHeader'
import GoToCard from '@/components/primitives/GoToCard'

export default function Home() {
    return (
        <Screen className='gap-4'>
            <PageHeader name='Home'/>
            <GoToCard name='Gathering' route='/home/gathering'/>
            <GoToCard name='Crafting' route='/home/crafting'/>
        </Screen>
    )
}