/**
 * Root layout stays a bare passthrough — the localized
 * `app/[locale]/layout.tsx` owns <html>/<body>, fonts, dir and chrome.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
