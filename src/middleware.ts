import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
    const isOnHome = req.nextUrl.pathname === '/'

    if (isOnDashboard && !isLoggedIn) {
        return Response.redirect(new URL('/', req.url))
    }

    if (isOnHome && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', req.url))
    }
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
