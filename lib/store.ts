import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  roles: string[];
  setAuth: (a: { accessToken: string; refreshToken: string }) => void;
  clear: () => void;
}

function decodeRoles(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.roles ?? [];
  } catch {
    return [];
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      roles: [],
      setAuth: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken, roles: decodeRoles(accessToken) }),
      clear: () => set({ accessToken: null, refreshToken: null, roles: [] }),
    }),
    { name: 'medflow-auth' },
  ),
);

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/** Role-aware landing page after auth (mirrors the header + route guards). */
export function dashboardPath(roles: string[], locale: string): string {
  if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return `/${locale}/dashboard/admin`;
  if (roles.includes('DOCTOR')) return `/${locale}/dashboard/doctor`;
  if (roles.includes('PATIENT')) return `/${locale}/dashboard/patient`;
  return `/${locale}/doctors`;
}

/** Refresh the access token using the stored refresh token. Returns true on success. */
async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setAuth, clear } = useAuth.getState();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clear();
      return false;
    }
    const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
    setAuth(tokens);
    return true;
  } catch {
    clear();
    return false;
  }
}

/**
 * Authenticated fetch with transparent refresh:
 * on 401, tries refresh once and retries the request.
 */
export async function api<T>(path: string, opts: RequestInit = {}, retried = false): Promise<T> {
  const { accessToken, clear } = useAuth.getState();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 401 && !retried && useAuth.getState().refreshToken) {
    const ok = await tryRefresh();
    if (ok) return api<T>(path, opts, true);
    clear();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text}`);
  }
  // 204 / empty bodies
  const text = await res.text().catch(() => '');
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function logout() {
  const { refreshToken, clear, accessToken } = useAuth.getState();
  try {
    if (accessToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);
    }
  } finally {
    clear();
  }
}

/**
 * Upload a doctor profile photo (multipart). Note: no JSON content-type —
 * the browser sets the multipart boundary automatically.
 */
export async function uploadDoctorPhoto(doctorId: string, file: File): Promise<any> {
  const { accessToken } = useAuth.getState();
  const form = new FormData();
  form.append('photo', file);
  const res = await fetch(`${API_URL}/doctors/${doctorId}/photo`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}
