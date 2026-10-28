import Image from "next/image";

// Pass the display width in pixels. The height follows the logo's proportions.
export default function Logo({ width = 96, priority = false, className = "" }) {
  const src = width > 120 ? "/logo.png" : "/logo-small.png";
  const height = Math.round(width * (967 / 700));

  return (
    <Image
      src={src}
      alt="Red Lions Jinzhou logo"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}