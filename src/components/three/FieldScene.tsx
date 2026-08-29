'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, Mesh, ShaderMaterial, Vector2, Vector3 } from 'three'

/**
 * A living field behind the whole site.
 *
 * One fullscreen shader, fixed to the viewport, that flows continuously and
 * responds to the cursor and to scroll. It sits behind every section rather
 * than only the hero, which is the point: an interactive hero followed by a
 * static page reads as a trick that ran out. This keeps the page feeling alive
 * from the first screen to the last.
 *
 * The look is domain-warped fractal noise, colour-mapped through the site
 * palette and then ordered-dithered. The dither is doing real work: banding is
 * unavoidable when you ramp a near-black gradient across a whole screen in
 * 8-bit colour, and an ordered threshold pattern trades that banding for fine
 * texture that reads as film grain rather than as a rendering fault.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;        // 0..1, eased
  uniform float uMouseForce;   // fades in on first movement
  uniform float uScroll;       // page progress, 0..1
  uniform vec3  uBackground;
  uniform vec3  uAccent;
  uniform vec3  uHighlight;
  uniform float uIntensity;

  varying vec2 vUv;

  // --- value noise -----------------------------------------------------------
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Quintic interpolation: smoother second derivative than smoothstep, which
    // matters once the noise is domain-warped and creases become visible.
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      total += noise(p) * amplitude;
      p *= 2.02;          // slightly off 2.0 to avoid axis-aligned repetition
      amplitude *= 0.5;
    }
    return total;
  }

  // --- ordered dithering -----------------------------------------------------
  // 4x4 Bayer threshold, computed rather than stored as a matrix.
  float bayer(vec2 fragCoord) {
    vec2 p = floor(mod(fragCoord, 4.0));
    float i = p.x + p.y * 4.0;
    float b = 0.0;
    b += step(0.5, mod(i, 2.0)) * 8.0;
    b += step(0.5, mod(floor(i / 2.0), 2.0)) * 4.0;
    b += step(0.5, mod(floor(i / 4.0), 2.0)) * 2.0;
    b += step(0.5, mod(floor(i / 8.0), 2.0)) * 1.0;
    return b / 16.0;
  }

  void main() {
    // Correct for aspect so the field does not stretch on wide screens.
    vec2 uv = vUv;
    vec2 p = uv;
    p.x *= uResolution.x / max(uResolution.y, 1.0);

    float t = uTime * 0.045;

    // Domain warping: sample noise at coordinates that are themselves offset by
    // noise. This is what turns smooth blobs into something that reads as fluid.
    vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t)), fbm(p * 1.6 + vec2(5.2, 1.3 - t)));
    vec2 r = vec2(
      fbm(p * 1.6 + 3.0 * q + vec2(1.7, 9.2) + t * 0.6),
      fbm(p * 1.6 + 3.0 * q + vec2(8.3, 2.8) - t * 0.4)
    );
    float field = fbm(p * 1.6 + 3.4 * r);

    // Cursor: a soft well that pulls the field toward the pointer.
    vec2 m = uMouse;
    m.x *= uResolution.x / max(uResolution.y, 1.0);
    float d = distance(p, m);
    float pull = uMouseForce * exp(-d * d * 5.5);
    field += pull * 0.3;

    // Scroll shifts the field so the background is never twice the same.
    field += uScroll * 0.16;

    field = clamp(field * uIntensity, 0.0, 1.0);

    // Palette ramp: mostly background, accent in the mid tones, a narrow
    // highlight at the top so the bright areas feel lit rather than washed.
    vec3 color = mix(uBackground, uAccent, smoothstep(0.44, 0.90, field));
    color = mix(color, uHighlight, smoothstep(0.8, 1.0, field) * 0.55);

    // Vignette keeps attention centre-screen and hides the field's edges.
    float vignette = smoothstep(1.05, 0.2, length(uv - 0.5));
    color *= mix(0.4, 1.0, vignette);

    // Dither before quantisation, scaled to one 8-bit step.
    color += (bayer(gl_FragCoord.xy) - 0.5) / 255.0 * 14.0;

    gl_FragColor = vec4(color, 1.0);
  }
`

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function Field({ active }: { active: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const { viewport, size } = useThree()

  const target = useRef({ mouse: new Vector2(0.5, 0.5), force: 0, scroll: 0 })

  const material = useMemo(() => {
    const accent = new Color(readVar('--accent', '#ff6b1a'))
    const background = new Color(readVar('--background', '#080808'))
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
        uMouse: { value: new Vector2(0.5, 0.5) },
        uMouseForce: { value: 0 },
        uScroll: { value: 0 },
        uBackground: { value: new Vector3(background.r, background.g, background.b) },
        uAccent: { value: new Vector3(accent.r * 0.46, accent.g * 0.23, accent.b * 0.1) },
        uHighlight: { value: new Vector3(accent.r * 0.9, accent.g * 0.5, accent.b * 0.2) },
        uIntensity: { value: 1.2 },
      },
    })
  }, [])

  useEffect(() => () => material.dispose(), [material])

  // Pointer and scroll are read from window rather than from R3F events: the
  // canvas is `pointer-events: none` so the page underneath stays clickable.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.mouse.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight)
      target.current.force = 1
    }
    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
      target.current.scroll = Math.min(1, Math.max(0, window.scrollY / max))
    }
    onScroll()
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useFrame((_, delta) => {
    const u = material.uniforms
    if (active) u.uTime.value += delta
    u.uResolution.value.set(size.width, size.height)

    // Ease every input. Snapping the field to the raw pointer looks nervous;
    // trailing it by a few frames is what makes it feel like a fluid.
    const ease = Math.min(1, delta * 3.2)
    u.uMouse.value.lerp(target.current.mouse, ease)
    u.uMouseForce.value += (target.current.force * 0.55 - u.uMouseForce.value) * ease
    u.uScroll.value += (target.current.scroll - u.uScroll.value) * Math.min(1, delta * 2.5)
  })

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[viewport.width, viewport.height]} />
    </mesh>
  )
}

export default function FieldScene({
  active = true,
  reduced = false,
}: {
  active?: boolean
  reduced?: boolean
}) {
  return (
    <Canvas
      // The field is low-frequency; rendering it at full retina resolution costs
      // a lot and shows almost nothing extra.
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'demand'}
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      style={{ pointerEvents: 'none' }}
    >
      <Field active={active && !reduced} />
    </Canvas>
  )
}
