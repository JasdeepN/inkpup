import Hero from '../components/Hero';
import { getHeroImage } from '../lib/hero-image';

export const revalidate = 300;

export default async function Home() {
  const heroImage = await getHeroImage();

  return (
    <>
      <Hero heroImage={heroImage} />

      <section className="container py-8">
        <h3 className="text-xl font-semibold">Portfolio</h3>
        <p className="text-gray-700">Visit our Instagram to see the latest work: <a className="text-accent underline" href="https://www.instagram.com/inkpup.tattoos/">@inkpup.tattoos</a></p>
      </section>
    </>
  );
}
