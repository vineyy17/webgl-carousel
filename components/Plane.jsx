import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import gsap from 'gsap';
import { useWave } from './WaveContext';

const Plane = ({ texture, width, height, active, ...props }) => {
  const $mesh = useRef();
  const { viewport } = useThree();
  const tex = useTexture(texture);
  const wave = useWave();

  useEffect(() => {
    if (!$mesh.current?.material) return;

    $mesh.current.material.uniforms.uZoomScale.value.x = viewport.width / width;
    $mesh.current.material.uniforms.uZoomScale.value.y = viewport.height / height;

    gsap.to($mesh.current.material.uniforms.uProgress, {
      value: active ? 1 : 0,
      duration: 1.4,
      ease: 'power3.out',
    });

    gsap.to($mesh.current.material.uniforms.uRes.value, {
      x: active ? viewport.width : width,
      y: active ? viewport.height : height,
      duration: 1.4,
      ease: 'power3.out',
    });
  }, [viewport, active, width, height]);

  useFrame(({ clock }) => {
    const mat = $mesh.current?.material;
    if (!mat?.uniforms) return;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uWave.value = wave?.current ?? 0;
  });

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uProgress: { value: 0 },
        uZoomScale: { value: { x: 1, y: 1 } },
        uTex: { value: tex },
        uRes: { value: { x: width, y: height } },
        uImageRes: {
          value: { x: tex.source.data.width, y: tex.source.data.height },
        },
        uTime: { value: 0 },
        uWave: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uProgress;
        uniform float uTime;
        uniform float uWave;
        uniform vec2 uZoomScale;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Slide ripple — stronger while moving
          float ripple = sin(uv.y * 9.0 + uTime * 2.4) * cos(uv.x * 6.0 - uTime * 1.6);
          pos.z += ripple * uWave * 0.22;
          pos.x += sin(uv.y * 4.0 + uTime) * uWave * 0.04;

          // Expand morph (click-to-fullscreen)
          float angle = uProgress * 3.14159265 / 2.;
          float wave = cos(angle);
          float c = sin(length(uv - .5) * 15. + uProgress * 12.) * .5 + .5;
          pos.x *= mix(1., uZoomScale.x + wave * c, uProgress);
          pos.y *= mix(1., uZoomScale.y + wave * c, uProgress);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        uniform vec2 uRes;
        uniform vec2 uImageRes;
        uniform float uWave;
        uniform float uTime;
        varying vec2 vUv;

        vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
          float rs = s.x / s.y;
          float ri = i.x / i.y;
          vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
          vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st;
          return u * s / st + o;
        }

        void main() {
          vec2 uv = CoverUV(vUv, uRes, uImageRes);
          // Chromatic nudge on scroll
          float aberr = uWave * 0.004;
          float r = texture2D(uTex, uv + vec2(aberr, 0.0)).r;
          float g = texture2D(uTex, uv).g;
          float b = texture2D(uTex, uv - vec2(aberr, 0.0)).b;
          vec3 tex = vec3(r, g, b);
          // Soft vignette while sliding
          float vig = smoothstep(1.1, 0.25, length(vUv - 0.5));
          tex *= mix(1.0, vig, clamp(uWave * 1.8, 0.0, 0.55));
          gl_FragColor = vec4(tex, 1.0);
        }
      `,
    }),
    [tex, width, height],
  );

  return (
    <mesh ref={$mesh} {...props}>
      <planeGeometry args={[width, height, 48, 48]} />
      <shaderMaterial args={[shaderArgs]} />
    </mesh>
  );
};

export default Plane;
