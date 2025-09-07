import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if(request.nextUrl.pathname.startsWith('/api')) {
    const authHeader = request.headers.get('Authorization')

    if(!authHeader) {
        return NextResponse.json(
            {success: false, message: 'Authorization header is required'},
            {status: 401}
        )
    }
  }
  return NextResponse.next()
}

export const config = {
    matcher: ['/api:path*']
}