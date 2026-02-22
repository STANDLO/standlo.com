export const authConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    cookieName: "session",
    cookieSignatureKeys: [
        process.env.SESSION_SECRET_CURRENT || "standlo-secret-key-1",
        process.env.SESSION_SECRET_PREVIOUS || "standlo-secret-key-2"
    ],
    cookieSerializeOptions: {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 12 * 60 * 60 * 24, // 12 days
    },
    serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'stub@standlo.iam.gserviceaccount.com',
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || 'stub').replace(/\\n/g, '\n'),
    },
};
