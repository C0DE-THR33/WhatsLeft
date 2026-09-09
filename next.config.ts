import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hosts allowed to load dev-server assets cross-origin. Next blocks this
  // by default, so reaching the dev server through a tunnel — which the
  // Setu AA sandbox needs, since the Bridge won't accept a localhost
  // redirect or notification URL — otherwise loads the HTML and then fails
  // every /_next/* request with no obvious cause. Dev only; `next start`
  // ignores it.
  allowedDevOrigins: ["*.loca.lt", "*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.io"],
  turbopack: {
    // Pin the workspace root to this project. Without it, Turbopack walks
    // up looking for a lockfile, finds a stray package-lock.json in
    // C:\Users\Dell, and warns on every dev start that it's ignoring a
    // lockfile outside the git repo.
    root: import.meta.dirname,
  },
};

export default nextConfig;
