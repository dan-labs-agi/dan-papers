/// <reference types="vite/client" />

import { ConvexReactClient } from "convex/react";

// Fallback to the newly deployed prod URL if the environment variable is missing or outdated
const convexUrl = import.meta.env.VITE_CONVEX_URL && !import.meta.env.VITE_CONVEX_URL.includes('beaming-starfish-640')
  ? import.meta.env.VITE_CONVEX_URL
  : "https://woozy-ibex-289.convex.cloud";

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is not set");
}

export const convex = new ConvexReactClient(convexUrl);
