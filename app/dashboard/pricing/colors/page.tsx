import { getD1Binding, getColorProfiles } from '../../../../lib/db/d1';
import ColorsClient from './ColorsClient';

export const metadata = {
  title: 'Color Profiles | Pricing Admin',
  description: 'Manage tattoo color profile pricing multipliers',
};

export default async function ColorsPage() {
  const db = getD1Binding();
  const colors = db ? await getColorProfiles(db) : [];

  return <ColorsClient initialColors={colors} />;
}
