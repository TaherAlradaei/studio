
"use client";

import Image from 'next/image';
import { useBackground } from '@/context/background-context';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppBackground() {
  const { currentBackground } = useBackground();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // On desktop, we don't want a background image on the welcome page (`/`)
  if (pathname === '/' && !isMobile) {
    return (
        <div className="fixed inset-0 -z-50 bg-background" />
    );
  }

  if (!currentBackground || !currentBackground.url) {
    return null; // Don't render anything if the background isn't ready
  }

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
        <AnimatePresence>
            <motion.div
                key={currentBackground.url + currentBackground.hint}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 1.5, ease: 'easeInOut' } }}
                exit={{ opacity: 0, transition: { duration: 1.5, ease: 'easeInOut' } }}
                className="absolute inset-0"
            >
                <Image
                    src={currentBackground.url}
                    alt="Football background"
                    fill
                    className="object-cover animate-kenburns"
                    data-ai-hint={currentBackground.hint}
                    priority
                />
                <div className="absolute inset-0 bg-black/60" />
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
