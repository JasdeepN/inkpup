import Gallery from '../../../components/Gallery';
import gallery from '../../../data/gallery';

export default function PortfolioItem({ params }) {
  // Simple slug-based placeholder; in real app map slug to gallery items
  return (
    <section>
      <h2>Portfolio item: {params.slug}</h2>
      <p>Gallery for this artist / project.</p>
  <Gallery items={gallery} />
    </section>
  );
}
