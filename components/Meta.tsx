import Head from 'next/head';
import { resolveR2Url } from '../lib/r2';

export function Meta({ title, description, url, image = undefined }: Readonly<{ title: string; description: string; url: string; image?: string }>) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
  {image && <meta property="og:image" content={resolveR2Url(image)} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
    </Head>
  );
}
