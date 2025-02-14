import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Se estiver tentando acessar uma rota pública e já estiver autenticado
  if (publicRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Se estiver tentando acessar uma rota protegida sem estar autenticado
  if (!publicRoutes.includes(pathname) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Rotas que o middleware irá interceptar
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto:
     * 1. /api (rotas de API)
     * 2. /_next (arquivos do Next.js)
     * 3. /static (arquivos estáticos)
     * 4. /favicon.ico, /robots.txt, /sitemap.xml
     */
    "/((?!api|_next|static|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};