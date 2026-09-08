import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project. Without it, Turbopack walks
    // up looking for a lockfile, finds a stray package-lock.json in
    // C:\Users\Dell, and warns on every dev start that it's ignoring a
    // lockfile outside the git repo.
    root: import.meta.dirname,
  },
};

export default nextConfig;
