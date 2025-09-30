import React from 'react';

export default function LocalBusinessJsonLd(props) {
  const { name, url, phone, street, city, region, postalCode, latitude, longitude, openingHours } = props;

  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name,
    url,
    telephone: phone || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: street || undefined,
      addressLocality: city || undefined,
      addressRegion: region || undefined,
      postalCode: postalCode || undefined,
      addressCountry: 'CA'
    }
  };

  if (openingHours) data.openingHours = openingHours;
  if (latitude && longitude) data.geo = { '@type': 'GeoCoordinates', latitude, longitude };

  return <script type="application/ld+json" data-testid="json-ld" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
