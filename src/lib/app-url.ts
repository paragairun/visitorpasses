// Canonical app URL used for auth email redirects (password reset, signup confirmation).
// Hard-coded to the GitHub Pages deployment so emails always send users to the live site,
// regardless of whether the link was triggered from a preview, custom domain, or localhost.
export const APP_URL = "https://paragairun.github.io/visitorpass";

export const appUrl = (path: string = "") => {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${APP_URL}${suffix}`;
};
