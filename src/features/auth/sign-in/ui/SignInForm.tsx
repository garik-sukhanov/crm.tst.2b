import { useUnit } from 'effector-react';
import type { FormEvent } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  $canSubmit,
  $email,
  $error,
  $password,
  $pending,
  emailChanged,
  passwordChanged,
  submitted,
} from '../model/sign-in';

export const SignInForm = () => {
  const [email, password, error, pending, canSubmit] = useUnit([
    $email,
    $password,
    $error,
    $pending,
    $canSubmit,
  ]);
  const [onEmail, onPassword, onSubmit] = useUnit([emailChanged, passwordChanged, submitted]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Почта</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="h-11 text-base md:text-sm"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          aria-invalid={!!error}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-11 text-base md:text-sm"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          aria-invalid={!!error}
        />
      </div>
      <p role="alert" className="min-h-5 text-sm text-destructive">
        {error}
      </p>
      <Button type="submit" size="lg" className="h-11" disabled={!canSubmit}>
        {pending ? 'Входим…' : 'Войти'}
      </Button>
    </form>
  );
};
