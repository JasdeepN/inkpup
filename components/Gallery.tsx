import Image from 'next/image';

export default function Gallery({ items }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {items.map((it, idx) => (
        <figure key={idx} className="m-0">
          <Image src={it.src} alt={it.alt || 'tattoo'} width={600} height={600} className="w-full h-auto object-cover rounded" />
          <figcaption className="text-xs p-2 text-gray-600">{it.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
