'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';

/** Dark/light/system toggle. Renders a placeholder until mounted (theme is client-only). */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(next)}
      title={next === 'dark' ? 'Dark' : 'Light'}
      aria-label="Toggle color theme"
      className="size-8"
    >
      {!mounted ? (
        <Sun className="size-4" />
      ) : theme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
