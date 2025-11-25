import { getD1Binding, getSizeCategories } from '../../../../lib/db/d1';
import SizesClient from './SizesClient';

export const metadata = {
  title: 'Size Categories | Pricing Admin',
  description: 'Manage tattoo size category price ranges',
};

export default async function SizesPage() {
  const db = getD1Binding();
  const sizes = db ? await getSizeCategories(db) : [];

  return <SizesClient initialSizes={sizes} />;
}
