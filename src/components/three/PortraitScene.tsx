'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
} from 'three'
import { buildCloud, loadImageData, type PortraitCloud } from './portrait'

const FALLBACK_ACCENT = '#6d4aff'

function readAccent(): string {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return FALLBACK_ACCENT
  }
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
    FALLBACK_ACCENT
  )
}

/** Low-core machines get a sparser cloud rather than a slideshow. */
function targetCount(): number {
  const cores =
    typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 8
  if (cores <= 4) return 12_000
  if (cores <= 8) return 28_000
  return 46_000
}

const vertexShader = /* glsl */ `
  uniform float uProgress;   // 0 = scattered shell, 1 = assembled portrait
  uniform float uTime;
  uniform vec3  uPointer;    // cursor in world space
  uniform float uPointerStrength;
  uniform float uSize;
  uniform float uDpr;

  attribute vec3  aScatter;
  attribute float aSeed;

  uniform vec3  uShadow;
  uniform vec3  uHighlight;
  uniform float uGrade;   // 0 = literal photo colour, 1 = full duotone

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Stagger the assembly per particle so the portrait resolves rather than
    // snapping into place. Each particle gets its own slice of the timeline.
    float stagger = aSeed * 0.45;
    float t = clamp((uProgress - stagger) / (1.0 - stagger + 0.0001), 0.0, 1.0);
    // Ease out cubic — fast approach, soft landing.
    t = 1.0 - pow(1.0 - t, 3.0);

    vec3 pos = mix(aScatter, position, t);

    // Idle drift, strongest while scattered so the assembled portrait stays crisp.
    float drift = (1.0 - t) * 0.5 + 0.03;
    pos.x += sin(uTime * 0.6 + aSeed * 12.0) * 0.06 * drift;
    pos.y += cos(uTime * 0.5 + aSeed * 9.0) * 0.06 * drift;
    pos.z += sin(uTime * 0.4 + aSeed * 7.0) * 0.08 * drift;

    // Cursor pushes particles aside, falling off with distance.
    vec3 toPointer = pos - uPointer;
    float d = length(toPointer);
    float push = uPointerStrength / (1.0 + d * d * 5.0);
    pos += normalize(toPointer + 0.0001) * push;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation, plus a lift for particles displaced by the cursor.
    gl_PointSize = uSize * uDpr * (1.0 + push * 3.0) * (8.0 / -mvPosition.z);

    // Duotone grade. The raw photograph carries the colour of the room it was
    // taken in, which fights the site's palette and reads as a snapshot pasted
    // into the page. Remapping luminance between two theme colours keeps the
    // likeness while making it look designed. A little original colour is
    // retained so skin does not go completely synthetic.
    float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 duotone = mix(uShadow, uHighlight, smoothstep(0.10, 0.62, lum));
    vColor = mix(color, duotone, uGrade);
    // Fade in as they arrive; keep scattered particles dim so the shell reads
    // as atmosphere rather than noise.
    vAlpha = mix(0.12, 0.95, t);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Round, soft-edged points. Discarding outside the disc avoids the square
    // artefact that makes particle systems look cheap.
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    float falloff = smoothstep(0.5, 0.06, dist);
    gl_FragColor = vec4(vColor, vAlpha * falloff);
  }
`

function PortraitPoints({
  cloud,
  accent,
  active,
  progressRef,
}: {
  cloud: PortraitCloud
  accent: string
  active: boolean
  progressRef: { current: number }
}) {
  const pointsRef = useRef<Points>(null)
  const { viewport } = useThree()

  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(cloud.positions, 3))
    g.setAttribute('color', new Float32BufferAttribute(cloud.colors, 3))
    g.setAttribute('aScatter', new Float32BufferAttribute(cloud.scatter, 3))
    g.setAttribute('aSeed', new Float32BufferAttribute(cloud.seeds, 1))
    return g
  }, [cloud])

  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      // Normal blending, not additive: overlapping particles under additive
      // blending sum toward white and destroy the tonal range the likeness
      // depends on. The face stops being readable.
      vertexColors: true,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uPointer: { value: [0, 0, 0] },
        uPointerStrength: { value: 0 },
        uSize: { value: 3.0 },
        uDpr: { value: 1 },
        uShadow: { value: new Color(accent).multiplyScalar(0.55) },
        uHighlight: { value: new Color('#f2eeff') },
        uGrade: { value: 0.82 },
      },
    })
  }, [accent])

  useEffect(() => () => {
    geometry.dispose()
    material.dispose()
  }, [geometry, material])

  useFrame((state, delta) => {
    const u = material.uniforms
    u.uTime.value += delta
    u.uDpr.value = Math.min(state.gl.getPixelRatio(), 2)

    // Ease toward the scroll-driven target so a fast scroll still looks fluid.
    u.uProgress.value += (progressRef.current - u.uProgress.value) * Math.min(1, delta * 4)

    const px = state.pointer.x * viewport.width * 0.5
    const py = state.pointer.y * viewport.height * 0.5
    u.uPointer.value = [px, py, 0]
    u.uPointerStrength.value += ((active ? 0.55 : 0) - u.uPointerStrength.value) * 0.08

    const points = pointsRef.current
    if (points) {
      // A slow yaw gives the flat point cloud a sense of volume.
      // Kept small on purpose: a wide yaw skews the projected face and the
      // likeness stops reading. This is a breath, not a turntable.
      points.rotation.y = Math.sin(u.uTime.value * 0.12) * 0.05
      points.rotation.x = Math.cos(u.uTime.value * 0.09) * 0.025
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}

export default function PortraitScene({
  image,
  active = true,
  reduced = false,
  progressRef,
}: {
  image: string
  active?: boolean
  reduced?: boolean
  progressRef: { current: number }
}) {
  const [cloud, setCloud] = useState<PortraitCloud | null>(null)
  const accent = useMemo(readAccent, [])

  useEffect(() => {
    let cancelled = false
    loadImageData(image)
      .then((data) => {
        if (cancelled) return
        setCloud(buildCloud(data, { target: targetCount() }))
      })
      .catch((error) => {
        // A missing or unreadable portrait must not break the page: the poster
        // stays, and the hero copy was never dependent on the canvas.
        console.warn('[portrait] falling back to poster:', (error as Error).message)
      })
    return () => {
      cancelled = true
    }
  }, [image])

  if (!cloud) return null

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'demand'}
      camera={{ position: [0, 0, 6.0], fov: 42 }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <PortraitPoints
        cloud={cloud}
        accent={accent}
        active={active && !reduced}
        progressRef={progressRef}
      />
    </Canvas>
  )
}
