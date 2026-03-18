import { isAdminInternalPath, toAdminExternalPath } from "@/lib/site/urls";

function splitHref(href: string) {
  const [path, ...queryParts] = href.split("?");
  return {
    path,
    query: queryParts.join("?"),
  };
}

export function usesInternalAdminBrowserPaths(pathname: string) {
  return isAdminInternalPath(pathname);
}

export function resolveAdminBrowserPath(
  currentPathname: string,
  targetPathname: string
) {
  if (!isAdminInternalPath(targetPathname)) {
    return targetPathname;
  }

  return usesInternalAdminBrowserPaths(currentPathname)
    ? targetPathname
    : toAdminExternalPath(targetPathname);
}

export function resolveAdminBrowserHref(
  currentPathname: string,
  href: string
) {
  const { path, query } = splitHref(href);
  const resolvedPath = resolveAdminBrowserPath(currentPathname, path);

  return query ? `${resolvedPath}?${query}` : resolvedPath;
}
