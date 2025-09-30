import Hero from '../components/Hero';

export default function Home() {
  return (
    <>
      <Hero />

      <section className="container py-8">
        <h3 className="text-xl font-semibold">Portfolio</h3>
        <p className="text-gray-700">Visit our Instagram to see the latest work: <a className="text-accent underline" href="https://www.instagram.com/inkpup.tattoos/">@inkpup.tattoos</a></p>
      </section>
    </>
  );
}
