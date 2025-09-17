'use client';

import { lazy, Suspense } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineBackgroundProps {
  scene?: string;
}

export function SplineBackground({
  scene = 'https://prod.spline.design/us3ALejTXl6usHZ7/scene.splinecode',
}: SplineBackgroundProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        pointerEvents: 'auto',
        overflow: 'hidden',
      }}
    >
      <Suspense
        fallback={
          <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900" />
        }
      >
        <Spline
          style={{
            width: '100%',
            height: '100vh',
            pointerEvents: 'auto',
          }}
          scene={scene}
        />
      </Suspense>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: `
            linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.8)),
            linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.9))
          `,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
