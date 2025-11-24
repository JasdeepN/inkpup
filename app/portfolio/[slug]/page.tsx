import Gallery from '../../../components/Gallery';
import gallery from '../../../data/gallery';
import RevealOnScroll from '../../../components/animations/RevealOnScroll';

type PortfolioItemPageProps = {
  readonly params: Promise<{ slug: string }>;
};

export default async function PortfolioItem(props: PortfolioItemPageProps) {
  const params = await props.params;
  const { slug } = params;

  return (
    <section>
      <RevealOnScroll>
      <h2>Portfolio item: {slug}</h2>
      <p>Gallery for this artist / project.</p>
      </RevealOnScroll>
      <RevealOnScroll delay={100}>
      <Gallery items={gallery} />
      </RevealOnScroll>
    </section>
  );
}
