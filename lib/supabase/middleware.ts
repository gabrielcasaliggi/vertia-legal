import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isPublicApi(pathname: string): boolean {
  return (
    pathname === "/api/health" ||
    pathname === "/api/health/pdf" ||
    pathname.startsWith("/api/notifications/digest")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isHealthApi = pathname.startsWith("/api/health");
  const isNotificationCron =
    pathname === "/api/notifications/digest" &&
    request.method === "POST" &&
    Boolean(process.env.NOTIFICATION_CRON_SECRET) &&
    request.headers.get("authorization") ===
      `Bearer ${process.env.NOTIFICATION_CRON_SECRET}`;

  if (isHealthApi || isNotificationCron) {
    return supabaseResponse;
  }

  if (!user && !isLogin && !isAuthApi && !isPublicApi(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "No autorizado.",
          details: "Iniciá sesión para continuar.",
        },
        { status: 401 },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && !profile.is_active) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: "Cuenta desactivada.",
            details: "Contactá al administrador del estudio.",
          },
          { status: 403 },
        );
      }
      if (!isLogin) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "inactive");
        return NextResponse.redirect(url);
      }
    }

    if (pathname.startsWith("/admin") && profile?.role !== "admin") {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Acceso denegado.", details: "Se requiere rol administrador." },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
