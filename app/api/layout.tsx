/** Prevents Next.js from prerendering API routes at build time (avoids needing env vars during build). */
export const dynamic = "force-dynamic";

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
