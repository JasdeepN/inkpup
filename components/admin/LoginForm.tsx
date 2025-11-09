'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '../../lib/admin-actions';

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(loginAction, null);

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-4 p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/20">
        <div>
          <h2 className="text-center text-2xl font-bold text-white">
            Admin Portal
          </h2>
          <p className="mt-1 text-center text-xs text-white/80">
            Sign in to access the dashboard
          </p>
        </div>

        <form className="space-y-3" action={formAction}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              className="appearance-none relative block w-full px-3 py-2 border border-white/30 placeholder-gray-400 text-gray-900 bg-white/95 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:z-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter password"
            />
          </div>

          {state?.error && (
            <div className="rounded-md bg-red-500/20 backdrop-blur-sm border border-red-500/50 p-2.5">
              <p className="text-xs text-red-100">{state.error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
