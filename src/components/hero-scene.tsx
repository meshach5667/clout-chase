import { Suspense, lazy, useEffect, useState } from "react";

const HeroSceneImpl = lazy(() => import("./hero-scene-impl"));

export function HeroScene({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={className} aria-hidden />;

  return (
    <Suspense fallback={<div className={className} aria-hidden />}>
      <HeroSceneImpl className={className} />
    </Suspense>
  );
}
