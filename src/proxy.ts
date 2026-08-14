import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  // Redirect bare /docs paths to the introduction page
  if (req.nextUrl.pathname.startsWith('/docs')) {
    return NextResponse.redirect(
      new URL('/docs/getting-started/introduction', req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/docs', '/docs/getting-started'],
};
