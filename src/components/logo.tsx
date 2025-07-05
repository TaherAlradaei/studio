import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="https://placehold.co/100x110.png"
      alt="Al Maidan Football Academy Logo"
      width={40}
      height={44}
      data-ai-hint="football academy shield logo"
      className="h-10 w-auto"
    />
  );
}
