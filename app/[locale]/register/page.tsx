'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { UserPlus, UserRound, Mail, Smartphone, Lock, CircleAlert, Stethoscope } from 'lucide-react';
import { api, useAuth, dashboardPath } from '@/lib/store';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { useT, useLocale } from '@/components/i18n-provider';

type Mode = 'email' | 'phone';
type AccountType = 'patient' | 'doctor';

export default function RegisterPage() {
  const t = useT();
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>('email');
  const [accountType, setAccountType] = useState<AccountType>('patient');

  // "Join as a doctor" CTAs link here with ?type=doctor → preselect the doctor tab.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('type') === 'doctor') {
      setAccountType('doctor');
    }
  }, []);

  const schema = z.object({
    contact: z
      .string()
      .min(1, mode === 'email' ? t.auth.emailErr : t.auth.phoneErr)
      .refine(
        (v) =>
          mode === 'email'
            ? z.string().email().safeParse(v).success
            : /^\+?[0-9]{8,15}$/.test(v.replace(/[\s\-()]/g, '')),
        { message: mode === 'email' ? t.auth.emailErr : t.auth.phoneErr },
      ),
    password: z.string().min(8, t.auth.passErr),
  });

  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const switchMode = (m: Mode) => {
    setMode(m);
    setServerError('');
    reset();
  };

  return (
    <AuthShell
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSub}
      footer={<>{t.auth.hasAccount}{' '}<Link href={`/${locale}/login`} className="font-bold text-primary hover:underline">{t.auth.loginBtn}</Link></>}
    >
      {/* account type */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(
          [
            { v: 'patient', label: t.auth.accountPatient, icon: UserRound },
            { v: 'doctor', label: t.auth.accountDoctor, icon: Stethoscope },
          ] as const
        ).map((tab) => (
          <button
            key={tab.v}
            type="button"
            onClick={() => setAccountType(tab.v)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-all ${
              accountType === tab.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>
      {accountType === 'doctor' && (
        <p className="mb-3 rounded-lg bg-blue-50 p-2.5 text-xs leading-5 text-blue-900">{t.auth.doctorNote}</p>
      )}

      {/* email / phone tabs */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(
          [
            { m: 'email', label: t.auth.tabEmail, icon: Mail },
            { m: 'phone', label: t.auth.tabPhone, icon: Smartphone },
          ] as const
        ).map((tab) => (
          <button
            key={tab.m}
            type="button"
            onClick={() => switchMode(tab.m)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold transition-all ${
              mode === tab.m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form
        className="space-y-3.5"
        onSubmit={handleSubmit(async (v) => {
          setServerError('');
          try {
            const contact =
              mode === 'email'
                ? { email: v.contact.trim() }
                : { phone: v.contact.replace(/[\s\-()]/g, '') };
            const body = { ...contact, password: v.password, asDoctor: accountType === 'doctor' };
            const tokens = await api<{ accessToken: string; refreshToken: string }>('/auth/register', {
              method: 'POST',
              body: JSON.stringify(body),
            });
            setAuth(tokens);
            router.push(dashboardPath(useAuth.getState().roles, locale));
          } catch {
            setServerError(t.auth.registerErr);
          }
        })}
      >
        <div>
          <div className="relative">
            {mode === 'email' ? (
              <Mail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            ) : (
              <Smartphone className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              {...register('contact')}
              placeholder={mode === 'email' ? t.auth.emailPh : t.auth.phonePh}
              className="ps-9"
              dir="ltr"
              inputMode={mode === 'email' ? 'email' : 'tel'}
              autoComplete={mode === 'email' ? 'email' : 'tel'}
            />
          </div>
          {formState.errors.contact && <p className="mt-1 text-xs font-semibold text-red-600">{formState.errors.contact.message}</p>}
          {mode === 'phone' && <p className="mt-1 text-[11px] text-muted-foreground">{t.auth.phoneHint}</p>}
        </div>
        <div>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput {...register('password')} placeholder={t.auth.registerPassPh} className="ps-9" dir="ltr" autoComplete="new-password" />
          </div>
          {formState.errors.password && <p className="mt-1 text-xs font-semibold text-red-600">{formState.errors.password.message}</p>}
        </div>
        {serverError && (
          <p className="flex items-center gap-1.5 rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700">
            <CircleAlert className="size-4 shrink-0" /> {serverError}
          </p>
        )}
        <Button className="w-full" size="lg" disabled={formState.isSubmitting}>
          <UserPlus /> {formState.isSubmitting ? t.auth.registerBtnBusy : t.auth.registerBtn}
        </Button>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">{t.auth.terms}</p>
      </form>
    </AuthShell>
  );
}
