import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    const sessionToken =
      req.cookies.get("next-auth.session-token")?.value ??
      req.cookies.get("__Secure-next-auth.session-token")?.value;

    // If no session token at all, redirect to home
    if (!sessionToken) {
      console.log("No session token found");
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Call session check API
    const response = await fetch(`${req.nextUrl.origin}/api/auth/session-check`, {
      headers: { 
        cookie: req.headers.get("cookie") ?? "",
        "Content-Type": "application/json"
      },
    });

    // Check if the response is OK
    if (!response.ok) {
      console.log(`Session check failed with status: ${response.status}`);
      // Clear invalid session cookie
      const redirectResponse = NextResponse.redirect(new URL("/", req.url));
      redirectResponse.cookies.delete("next-auth.session-token");
      redirectResponse.cookies.delete("__Secure-next-auth.session-token");
      return redirectResponse;
    }

    // Safely parse the JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("Failed to parse session response:", parseError);
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Debug log to see what the API returns
    console.log("Session data:", JSON.stringify(data, null, 2));

    // Safely access the role with proper null checking
    const role = data?.user?.role;

    if (!role) {
      console.log("No role found in session data");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    console.log("User role:", role);

    // Role-based access control
    if (pathname.startsWith("/admin") && role !== "admin") {
      console.log(`Unauthorized admin access attempt by role: ${role}`);
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/donor") && role !== "registered") {
      console.log(`Unauthorized donor access attempt by role: ${role}`);
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/beneficiary") && role !== "beneficiary") {
      console.log(`Unauthorized beneficiary access attempt by role: ${role}`);
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
    
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
}

export const config = {
  matcher: ["/donor/:path*", "/admin/:path*", "/beneficiary/:path*"],
};