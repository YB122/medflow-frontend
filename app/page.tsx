import { redirect } from 'next/navigation';

/** Fallback — middleware normally redirects `/` to the localized home first. */
export default function RootPage() {
  redirect('/ar');
}
