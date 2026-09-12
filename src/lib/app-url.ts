// Canonical app URL used for auth email redirects (password reset, signup confirmation).
// Hard-coded to the live custom domain so emails always send users to the production site,
// regardless of whether the link was triggered from a preview, a GitHub Pages URL, or localhost.
//
// IMPORTANT: whatever value is used here must also be listed under
// Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs
// (e.g. https://visitorpasses.in/**). If it is not allow-listed, Supabase
// silently ignores `redirectTo` and falls back to the project's Site URL.
export const APP_URL = "https://visitorpasses.in";

export const appUrl = (path: string = "") => {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${APP_URL}${suffix}`;
};
