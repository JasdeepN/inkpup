import Image from 'next/image';

export default function Hero({ title = 'Custom Tattoos & Cover-ups', subtitle = 'InkPup Tattoos — Toronto (GTA). Book by appointment.' }) {
  return (
    <section className="bg-gradient-to-r from-white to-gray-50">
      <div className="container grid gap-6 md:grid-cols-2 items-center py-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold">{title}</h1>
          <p className="text-gray-700">{subtitle}</p>
          <div className="flex items-center gap-3">
            <a href="/contact" className="btn btn--primary">Book an appointment</a>
            <a href="https://www.instagram.com/inkpup.tattoos/" target="_blank" rel="noreferrer" className="text-sm text-gray-600 underline">View portfolio</a>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="rounded-lg overflow-hidden shadow-lg">
            <Image src="/social/sample1.jpg" alt="tattoo sample" width={800} height={600} className="w-full h-auto object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
