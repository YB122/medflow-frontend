'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { LogIn, UserRound, Lock, CircleAlert } from 'lucide-react';
import { api, useAuth, dashboardPath } from '@/lib/store';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { useT, useLocale } from '@/components/i18n-provider';

const isEmail = (v: string) => z.string().email().safeParse(v).success;
const isPhone = (v: string) => /^\+?[0-9]{8,15}$/.test(v.replace(/[\s\-()]/g, ''));

export default function LoginPage() {
  const t = useT();
  const locale = useLocale();
  const schema = z.object({
    identifier: z.string().min(1, t.auth.identifierErr).refine((v) => isEmail(v) || isPhone(v), {
      message: t.auth.identifierErr,
    }),
    password: z.string().min(1, t.auth.passErr),
  });

  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  return (
    <AuthShell
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSub}
      footer={<>{t.auth.noAccount}{' '}<Link href={`/${locale}/register`} className="font-bold text-primary hover:underline">{t.auth.createAccount}</Link></>}
    >
      <form
        className="space-y-3.5"
        onSubmit={handleSubmit(async (v) => {
          setServerError('');
          try {
            const tokens = await api<{ accessToken: string; refreshToken: string }>('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ identifier: v.identifier.trim(), password: v.password }),
            });
            setAuth(tokens);
            router.push(dashboardPath(useAuth.getState().roles, locale));
          } catch {
            setServerError(t.auth.loginErr);
          }
        })}
      >
        <div>
          <div className="relative">
            <UserRound className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input {...register('identifier')} placeholder={t.auth.identifierPh} className="ps-9" dir="ltr" autoComplete="username" />
          </div>
          {formState.errors.identifier && <p className="mt-1 text-xs font-semibold text-red-600">{formState.errors.identifier.message}</p>}
        </div>
        <div>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput {...register('password')} placeholder={t.auth.passPh} className="ps-9" dir="ltr" autoComplete="current-password" />
          </div>
          {formState.errors.password && <p className="mt-1 text-xs font-semibold text-red-600">{formState.errors.password.message}</p>}
        </div>
        {serverError && (
          <p className="flex items-center gap-1.5 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700">
            <CircleAlert className="size-4 shrink-0" /> {serverError}
          </p>
        )}
        <Button className="w-full" size="lg" disabled={formState.isSubmitting}>
          <LogIn /> {formState.isSubmitting ? t.auth.loginBtnBusy : t.auth.loginBtn}
        </Button>
      </form>
    </AuthShell>
  );
}
