import Gallery from '../../../components/Gallery';
import gallery from '../../../data/gallery';

type PortfolioItemPageProps = {
  readonly params: { slug: string };
};

export default function PortfolioItem({ params }: PortfolioItemPageProps) {
  const { slug } = params;

  return (
    <section>
      <h2>Portfolio item: {slug}</h2>
      <p>Gallery for this artist / project.</p>
      <Gallery items={gallery} />
    </section>
  );
}
