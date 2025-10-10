import Image from 'next/image';

type Props = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  onLoadingComplete?: (img: HTMLImageElement) => void;
};

export default function SmartImage({
  src,
  alt = '',
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  onLoadingComplete,
}: Readonly<Props>) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        onLoadingComplete={onLoadingComplete}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onLoadingComplete={onLoadingComplete}
    />
  );
}
