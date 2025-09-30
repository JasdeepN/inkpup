import Image from 'next/image';
import { resolveR2Url } from '../lib/r2';

type Props = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export default function SmartImage({ src, alt = '', width, height, className, priority = false }: Readonly<Props>) {
  const resolved = resolveR2Url(src);
  return <Image src={resolved} alt={alt} width={width} height={height} className={className} priority={priority} />;
}
