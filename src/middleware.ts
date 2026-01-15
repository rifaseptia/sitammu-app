import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    const { data: { session } } = await supabase.auth.getSession()

    const pathname = req.nextUrl.pathname

    // Public routes that don't require auth
    const publicRoutes = ['/login', '/register', '/forgot-password']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // API routes should be handled by their own auth
    if (pathname.startsWith('/api')) {
        return res
    }

    // If on root path, redirect based on auth status
    if (pathname === '/') {
        if (session) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        } else {
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }

    // If not authenticated and trying to access protected route
    if (!session && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // If authenticated and trying to access login page, redirect to dashboard
    if (session && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
