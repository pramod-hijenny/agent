/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type NavigateTarget = string | { to: string };
type NavigateOptions = { replace?: boolean };

const RouterContext = createContext({
  pathname: typeof window === "undefined" ? "/" : window.location.pathname,
});

const RouteParamsContext = createContext<Record<string, string>>({});

export function navigate(target: NavigateTarget, options: NavigateOptions = {}) {
  if (typeof window === "undefined") return;

  const to = typeof target === "string" ? target : target.to;
  if (window.location.pathname === to) return;

  if (options.replace) {
    window.history.replaceState({}, "", to);
  } else {
    window.history.pushState({}, "", to);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(() =>
    typeof window === "undefined" ? "/" : window.location.pathname,
  );

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const value = useMemo(() => ({ pathname }), [pathname]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function RouteParamsProvider({
  params,
  children,
}: {
  params: Record<string, string>;
  children: React.ReactNode;
}) {
  return <RouteParamsContext.Provider value={params}>{children}</RouteParamsContext.Provider>;
}

export function usePathname() {
  return useContext(RouterContext).pathname;
}

export function useNavigate() {
  return navigate;
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useContext(RouteParamsContext) as T;
}

export function resolvePath(to: string, params?: Record<string, string>) {
  if (!params) return to;
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`$${key}`, encodeURIComponent(value)),
    to,
  );
}

export const Link = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    to: string;
    params?: Record<string, string>;
  }
>(function Link({ to, params, onClick, children, ...props }, ref) {
  const href = resolvePath(to, params);

  return (
    <a
      ref={ref}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey ||
          props.target
        ) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
});
