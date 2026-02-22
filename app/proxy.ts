import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export function middleware(request: NextRequest) {
  console.log("---------------------------------------");
  console.log("BOUNCER IS AWAKE AT:", request.nextUrl.pathname);
  console.log("---------------------------------------");

  return NextResponse.next();
}
