import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/log-ind",
});

export const config = {
  matcher: [
    "/mine-annoncer/:path*",
    "/annoncer/:path*",
    "/profil/:path*",
  ],
};

