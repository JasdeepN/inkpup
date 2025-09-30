import Image from 'next/image';

export default function Gallery({ items }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {items.map((it, idx) => (
        <figure key={it.src || it.id || idx} className="m-0" data-e2e-id={`gallery-item-${idx}`}>
          <Image src={it.src} alt={it.alt || 'tattoo'} width={600} height={600} className="w-full h-auto object-cover rounded" data-e2e-id={`gallery-img-${idx}`} />
          <figcaption className="text-xs p-2 text-gray-600" data-e2e-id={`gallery-caption-${idx}`}>{it.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
