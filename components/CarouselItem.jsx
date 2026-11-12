import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import Plane from './Plane';

const CarouselItem = ({
  index,
  width,
  height,
  setActivePlane,
  activePlane,
  item,
}) => {
  const $root = useRef();
  const $inner = useRef();
  const [hover, setHover] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isCloseActive, setCloseActive] = useState(false);
  const { viewport } = useThree();
  const timeoutID = useRef();

  useEffect(() => {
    if (activePlane === index) {
      setIsActive(true);
      setCloseActive(true);
    } else {
      setIsActive(false);
    }
  }, [activePlane, index]);

  useEffect(() => {
    gsap.killTweensOf($root.current.position);
    gsap.to($root.current.position, {
      z: isActive ? 0.01 : $root.current.position.z,
      duration: 0.2,
      ease: 'power3.out',
      delay: isActive ? 0 : 1.2,
    });
  }, [isActive]);

  /* Hover scales inner mesh only — parent scale is owned by the coverflow */
  useEffect(() => {
    if (!$inner.current) return;
    const hoverScale = hover && !isActive ? 1.04 : 1;
    gsap.to($inner.current.scale, {
      x: hoverScale,
      y: hoverScale,
      duration: 0.4,
      ease: 'power3.out',
    });
  }, [hover, isActive]);

  const handleClose = (e) => {
    e.stopPropagation();
    if (!isActive) return;
    setActivePlane(null);
    setHover(false);
    clearTimeout(timeoutID.current);
    timeoutID.current = setTimeout(() => {
      setCloseActive(false);
    }, 1500);
  };

  return (
    <group
      ref={$root}
      onClick={() => {
        setActivePlane(index);
      }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <group ref={$inner}>
        <Plane
          width={width}
          height={height}
          texture={item.image}
          active={isActive}
        />
      </group>

      {isCloseActive ? (
        <mesh position={[0, 0, 0.01]} onClick={handleClose}>
          <planeGeometry args={[viewport.width, viewport.height]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ) : null}
    </group>
  );
};

export default CarouselItem;
