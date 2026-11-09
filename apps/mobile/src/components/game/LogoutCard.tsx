import { View, Text } from 'react-native'
import { toast } from '../primitives/Toast'
import { useAuth } from '@/providers/AuthProvider'
import { errorMessage } from '@/lib/api-service-layer/errors'
import { Button } from '../primitives/Button'
import { Screen } from '../primitives/Screen'
import { Card } from '../primitives/Card'

export default function LogoutCard() {
    const auth = useAuth()
    const logOut = async () => {
        try {
            await auth.logOut()
            toast.success("Logged Out")
        } catch (error) {
            toast.error(errorMessage(error))
        }
    }

    return (
        <Card className='gap-4 flex-row justify-between items-center'>

            <Button
                title="Log Out"
                onPress={logOut}
                size="sm"
                fullWidth
                variant="secondary"
            />
        </Card>
    )
}