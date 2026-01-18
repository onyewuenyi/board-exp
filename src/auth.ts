import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [Google],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            try {
                // Sync with backend
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/auth/sync`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        google_id: user.id || account?.providerAccountId,
                        email: user.email,
                        name: user.name || "Unknown Parent",
                        image: user.image,
                    }),
                });

                if (!res.ok) {
                    console.error("Backend auth sync failed", await res.text());
                    return false;
                }

                const data = await res.json();
                // Determine if we should allow login (e.g. check created user)
                // For MVP, if backend sync (create/link) works, we allow.

                // We can attach backend data to the token in the jwt callback, 
                // since signIn happens before jwt.
                // However, we can't pass data from signIn to jwt directly easily 
                // without augmenting the user object, which is mutated.
                (user as any).familyId = data.family.id;
                (user as any).dbId = data.user.id;

                return true;
            } catch (error) {
                console.error("Auth sync error", error);
                return false;
            }
        },
        async jwt({ token, user }) {
            if (user) {
                token.familyId = (user as any).familyId;
                token.dbId = (user as any).dbId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).familyId = token.familyId;
                (session.user as any).dbId = token.dbId;
            }
            return session;
        },
    },
    pages: {
        signIn: '/', // Custom sign-in page (Home)
        error: '/',  // Error page
    },
})
