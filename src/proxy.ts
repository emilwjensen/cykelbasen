import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/log-ind",
});

export const config = {
  matcher: [
    "/mine-annoncer/:path*",
    "/annoncer/:path*",
    "/profil/:path*",
    "/favoritter/:path*",
    "/henvendelser/:path*",
    "/forum/nyt",
    "/forum/indlaeg/:path*/rediger",
    "/admin/:path*",
    "/mine-cykler/:path*",
  ],
};
