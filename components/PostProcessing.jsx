import { forwardRef } from 'react';
import { useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';

/**
 * Full-frame glass layer — thickness driven by scroll velocity (set from Carousel).
 * Leva removed for production polish.
 */
const PostProcessing = forwardRef((_, ref) => {
  const { viewport } = useThree();

  return (
    <mesh position={[0, 0, 1]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <MeshTransmissionMaterial
        ref={ref}
        transmission={0.42}
        roughness={0.08}
        thickness={0}
        chromaticAberration={0.02}
        anisotropy={0.1}
        distortion={0.08}
        distortionScale={0.15}
        temporalDistortion={0.08}
      />
    </mesh>
  );
});

PostProcessing.displayName = 'PostProcessing';

export default PostProcessing;
