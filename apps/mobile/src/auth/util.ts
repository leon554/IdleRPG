import { PublicUser } from "@/providers/AuthProvider";
import { AuthState, User } from "@idlerpg/shared";

export function getAuthState(user: PublicUser | null): AuthState{
    if(!user) return "Logged-Out"
    if(user.emailVerifiedAt) return "Signed-In-Email-Verified"
    return "Signed-In-Email-Not-Verified"
}