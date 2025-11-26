import { getD1Binding, getStyles, getColorProfiles } from '../../../../lib/db/d1';
import StylesClient from './StylesClient';

export const metadata = {
  title: 'Tattoo Styles | Pricing Admin',
  description: 'Manage tattoo style pricing multipliers',
};

export default async function StylesPage() {
  const db = getD1Binding();
  const [styles, colorProfiles] = db 
    ? await Promise.all([getStyles(db), getColorProfiles(db)])
    : [[], []];

  return <StylesClient initialStyles={styles} colorProfiles={colorProfiles} />;
}
