import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ACTIVE_ORG_COOKIE = "vertia_active_org";

function isPublicApi(pathname: string): boolean {
  return (
    pathname === "/api/health" ||
    pathname === "/api/health/pdf" ||
    pathname.startsWith("/api/notifications/digest")
  );
}

function isOrgSelectionExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/seleccionar-organizacion") ||
    pathname === "/platform" ||
    pathname.startsWith("/platform/") ||
    pathname.startsWith("/api/platform") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health")
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

    if (
      pathname === "/platform" ||
      pathname.startsWith("/platform/") ||
      pathname.startsWith("/api/platform/")
    ) {
      const { data: platformAdmin } = await supabase
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!platformAdmin) {
        if (pathname.startsWith("/api/platform")) {
          return NextResponse.json(
            {
              error: "Acceso denegado.",
              details: "Se requiere acceso de plataforma Vertia.",
            },
            { status: 403 },
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/";
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

    if (!isOrgSelectionExempt(pathname)) {
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const orgIds = (memberships ?? []).map((membership) => membership.organization_id);
      if (orgIds.length > 1) {
        const cookieOrgId = request.cookies.get(ACTIVE_ORG_COOKIE)?.value?.trim();
        const hasValidCookie = Boolean(cookieOrgId && orgIds.includes(cookieOrgId));

        if (!hasValidCookie) {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              {
                error: "Organización no seleccionada.",
                details: "Seleccioná una organización activa para continuar.",
              },
              { status: 409 },
            );
          }

          const url = request.nextUrl.clone();
          url.pathname = "/seleccionar-organizacion";
          return NextResponse.redirect(url);
        }
      }
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
