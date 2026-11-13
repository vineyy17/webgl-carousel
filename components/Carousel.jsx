import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { usePrevious } from 'react-use';
import gsap from 'gsap';
import PostProcessing from './PostProcessing';
import CarouselItem from './CarouselItem';
import { useWave } from './WaveContext';
import { lerp, wrapIndex, wrappedDelta } from '../utils';
import images from '../data/images';

/* Compact planes — middle is smallest, neighbors grow outward */
const planeSettings = {
  width: 1.05,
  height: 1.35,
  gap: 0.28,
};

const COUNT = images.length;

gsap.defaults({
  duration: 1.0,
  ease: 'power3.out',
});

const Carousel = () => {
  const [$root, setRoot] = useState();
  const $post = useRef();
  const wave = useWave();

  const [activePlane, setActivePlane] = useState(null);
  const prevActivePlane = usePrevious(activePlane);
  const { viewport } = useThree();

  const progress = useRef(0);
  const target = useRef(0);
  const velocity = useRef(0);
  const startX = useRef(0);
  const isDown = useRef(false);
  const oldProgress = useRef(0);
  const speed = useRef(0);
  const reducedMotion = useRef(false);

  const speedWheel = 0.0032;
  const speedDrag = -0.005;

  const $items = useMemo(() => {
    if ($root) return $root.children;
  }, [$root]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = mq.matches;
    const onChange = () => {
      reducedMotion.current = mq.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /**
   * Even edge-to-edge gaps: layout from the focused slide outward using
   * each plane's half-width × scale + a constant gap. Center stays slightly
   * smaller; neighbors grow — without the old fixed stride that looked uneven.
   */
  const layoutForActive = (active) => {
    const scaleOf = (dist) => Math.min(0.82 + dist * 0.1, 1.08);
    const halfW = (scale) => (planeSettings.width * scale) / 2;
    const gap = planeSettings.gap;

    const deltas = Array.from({ length: COUNT }, (_, i) =>
      wrappedDelta(i, active, COUNT),
    );
    const scales = deltas.map((d) => scaleOf(Math.abs(d)));
    const order = Array.from({ length: COUNT }, (_, i) => i).sort(
      (a, b) => deltas[a] - deltas[b],
    );

    const xs = new Array(COUNT).fill(0);
    for (let k = 1; k < order.length; k++) {
      const prev = order[k - 1];
      const curr = order[k];
      xs[curr] = xs[prev] + halfW(scales[prev]) + gap + halfW(scales[curr]);
    }

    const activeX = xs[active];
    for (let i = 0; i < COUNT; i++) xs[i] -= activeX;

    return { xs, scales, deltas };
  };

  const displayItems = (item, index, active, layout) => {
    const delta = layout.deltas[index];
    const dist = Math.abs(delta);
    const scale = layout.scales[index];
    const nextX = layout.xs[index];

    // Same easing/feel as before at slow speed (0.7s).
    // Only when moving fast: shorten so tweens keep up and planes don't cross.
    const dur = reducedMotion.current
      ? 0.01
      : Math.max(0.18, 0.7 / (1 + speed.current * 0.55));

    // Snap infinite wrap jumps — don't tween side→side through the center
    const wrapJump = Math.abs(nextX - item.position.x) > planeSettings.width * 2.2;
    if (wrapJump) {
      gsap.killTweensOf(item.position);
      item.position.set(nextX, 0, -dist * 0.42);
    } else {
      gsap.to(item.position, {
        x: nextX,
        y: 0,
        z: -dist * 0.42,
        duration: dur,
        ease: 'power3.out',
        overwrite: true,
      });
    }

    gsap.to(item.rotation, {
      y: delta * -0.14,
      z: 0,
      duration: dur,
      ease: 'power3.out',
      overwrite: true,
    });

    gsap.to(item.scale, {
      x: scale,
      y: scale,
      z: 1,
      duration: dur,
      ease: 'power3.out',
      overwrite: true,
    });
  };

  const snap = () => {
    target.current = Math.round(target.current);
  };

  useFrame((_, delta) => {
    if (activePlane === null) {
      target.current += velocity.current;
      velocity.current *= 0.9;
      if (Math.abs(velocity.current) < 0.00035) velocity.current = 0;

      if (!isDown.current && Math.abs(velocity.current) < 0.002) {
        const nearest = Math.round(target.current);
        target.current = lerp(target.current, nearest, reducedMotion.current ? 1 : 0.14);
      }

      progress.current = lerp(progress.current, target.current, reducedMotion.current ? 1 : 0.16);
    }

    const active = wrapIndex(progress.current, COUNT);
    if ($items) {
      const layout = layoutForActive(active);
      $items.forEach((item, index) => displayItems(item, index, active, layout));
    }

    const deltaProg = Math.abs(oldProgress.current - progress.current);
    speed.current = lerp(speed.current, deltaProg * (1 / Math.max(delta, 0.016)), 0.12);
    oldProgress.current = progress.current;

    if (wave) {
      wave.current = Math.min(speed.current * 1.6, 1);
    }

    if ($post.current) {
      $post.current.thickness = Math.min(speed.current * 1.8, 1.1);
    }
  });

  const handleWheel = (e) => {
    if (activePlane !== null) return;
    const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);
    const wheelProgress = isVerticalScroll ? e.deltaY : e.deltaX;
    velocity.current += wheelProgress * speedWheel;
  };

  const handleDown = (e) => {
    if (activePlane !== null) return;
    isDown.current = true;
    velocity.current = 0;
    startX.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  };

  const handleUp = () => {
    if (!isDown.current) return;
    isDown.current = false;
    snap();
  };

  const handleMove = (e) => {
    if (activePlane !== null || !isDown.current) return;
    const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const mouseProgress = (x - startX.current) * speedDrag;
    target.current += mouseProgress;
    velocity.current = mouseProgress * 0.4;
    startX.current = x;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (activePlane !== null) {
        if (e.key === 'Escape') setActivePlane(null);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        target.current = Math.round(target.current) + 1;
        velocity.current = 0;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        target.current = Math.round(target.current) - 1;
        velocity.current = 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePlane]);

  useEffect(() => {
    if (!$items) return;
    if (activePlane !== null && prevActivePlane === null) {
      const current = wrapIndex(progress.current, COUNT);
      let diff = activePlane - current;
      const half = COUNT / 2;
      if (diff > half) diff -= COUNT;
      if (diff < -half) diff += COUNT;
      target.current = progress.current + diff;
      progress.current = target.current;
      velocity.current = 0;
    }
  }, [activePlane, $items, prevActivePlane]);

  return (
    <group>
      <mesh
        position={[0, 0, -0.01]}
        onWheel={handleWheel}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerMove={handleMove}
        onPointerLeave={handleUp}
        onPointerCancel={handleUp}
      >
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <group ref={setRoot}>
        {images.map((item, i) => (
          <CarouselItem
            width={planeSettings.width}
            height={planeSettings.height}
            setActivePlane={setActivePlane}
            activePlane={activePlane}
            key={item.image}
            item={item}
            index={i}
          />
        ))}
      </group>

      <PostProcessing ref={$post} />
    </group>
  );
};

export default Carousel;
