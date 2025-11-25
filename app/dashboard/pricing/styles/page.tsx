import { getD1Binding, getStyles } from '../../../../lib/db/d1';
import StylesClient from './StylesClient';

export const metadata = {
  title: 'Tattoo Styles | Pricing Admin',
  description: 'Manage tattoo style pricing multipliers',
};

export default async function StylesPage() {
  const db = getD1Binding();
  const styles = db ? await getStyles(db) : [];

  return <StylesClient initialStyles={styles} />;
}
