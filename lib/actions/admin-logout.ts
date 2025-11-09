"use server";
import { getSessionCookieClearOptions } from '../admin-auth';
import { cookies } from 'next/headers';
import { ADMIN_PUBLIC_BASE_PATH } from '../admin-hosts';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const { name, options } = getSessionCookieClearOptions();
  const store = await cookies();
  store.set(name, '', options);
  redirect(`${ADMIN_PUBLIC_BASE_PATH}?status=logout`);
}
