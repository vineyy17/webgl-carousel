import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import Carousel from '../components/Carousel';
import Loading from '../components/Loading';
import { WaveProvider } from '../components/WaveContext';

function Hint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), 4800);
    const hide = () => setVisible(false);
    window.addEventListener('wheel', hide, { once: true, passive: true });
    window.addEventListener('pointerdown', hide, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('wheel', hide);
      window.removeEventListener('pointerdown', hide);
    };
  }, []);

  return (
    <p className={`chrome-hint${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      Drag · Scroll · Arrows · Click to open
    </p>
  );
}

export default function App() {
  return (
    <div className="App">
      <Loading />
      <header className="chrome">
        <p className="chrome-title">Infinite coverflow</p>
        <Hint />
      </header>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5.8], fov: 40 }}
      >
        <color attach="background" args={['#070707']} />
        <WaveProvider>
          <Suspense fallback={null}>
            <Carousel />
            <Preload all />
          </Suspense>
        </WaveProvider>
      </Canvas>
    </div>
  );
}
