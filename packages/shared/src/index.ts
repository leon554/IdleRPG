export * from "./gameData.js"

export type HealthResponse = {
    status: 'ok' | 'error';
    db: 'up' | 'down';
    timestamp: string;
};

export type SignUpBody = {
    email: string,
    userName: string,
    password: string
}

export type NumberValidationParams = {
    upperBound?: number
    lowerBound?: number,
    wholeNumber?: boolean
}

export type StringValidationParams = {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  trim?: boolean; 
  lowerCase?: boolean;
};

export type AuthUser = {
  id: string;
  emailVerifiedAt: Date | null;
};

export type AuthRow = {
    sessionId: string;
    expiresAt: Date;
    id: string;
    emailVerifiedAt: Date | null;
}

export type User =  {
    id: string;
    userName: string;
    email: string;
    passwordHash: string;
    emailVerifiedAt: Date | null;
    createdAt: Date;
}

export type AuthState = "Logged-Out" | "Signed-In-Email-Verified" | "Signed-In-Email-Not-Verified"