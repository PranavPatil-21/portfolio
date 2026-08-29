'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Group, MathUtils, Mesh, Color } from 'three'
import { buildHeadGeometry, buildHair } from './head'

const FALLBACK_ACCENT = '#ff6b1a'

function readAccent(): string {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return FALLBACK_ACCENT
  }
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() ||
    FALLBACK_ACCENT
  )
}

/** Low-core machines get a coarser head and fewer tufts rather than a slideshow. */
function quality(): { segments: number; tufts: number } {
  const cores =
    typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 8
  if (cores <= 4) return { segments: 32, tufts: 80 }
  if (cores <= 8) return { segments: 48, tufts: 120 }
  return { segments: 64, tufts: 165 }
}

/**
 * The character: a stylised bust, lit almost entirely from behind.
 *
 * Nearly all of the read is silhouette and rim. The surface is a very dark warm
 * material that returns almost nothing to a front light, so the shape is
 * described by the orange key wrapping its edge — which is why the geometry can
 * stay this simple and still hold up.
 */
function Character({ accent, active }: { accent: string; active: boolean }) {
  const groupRef = useRef<Group>(null)
  const { segments, tufts } = useMemo(quality, [])
  const headGeometry = useMemo(() => buildHeadGeometry(segments), [segments])
  const hair = useMemo(() => buildHair(tufts), [tufts])

  useEffect(() => () => headGeometry.dispose(), [headGeometry])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group || !active) return
    const t = state.clock.elapsedTime

    // A slow breathing drift, plus a gentle turn toward the cursor. Both are
    // small: a bust that swings around reads as a toy rather than a portrait.
    group.rotation.y = MathUtils.lerp(
      group.rotation.y,
      -0.34 + state.pointer.x * 0.2 + Math.sin(t * 0.25) * 0.04,
      Math.min(1, delta * 2),
    )
    group.rotation.x = MathUtils.lerp(
      group.rotation.x,
      -0.1 - state.pointer.y * 0.09,
      Math.min(1, delta * 2),
    )
    group.position.y = Math.sin(t * 0.5) * 0.045
  })

  const skin = useMemo(() => new Color('#20140f'), [])

  return (
    <group ref={groupRef} position={[0, -0.55, 0]} scale={1.45} rotation={[-0.08, -0.34, 0]}>
      <mesh geometry={headGeometry}>
        <meshStandardMaterial color={skin} roughness={0.58} metalness={0.04} />
      </mesh>

      {/* Hair: overlapping spheres. Only the outline survives the rim light. */}
      {hair.map((tuft, i) => (
        <mesh key={i} position={tuft.position} scale={tuft.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#140c09" roughness={0.72} metalness={0.02} />
        </mesh>
      ))}

      {/* Brow and nose: just enough to break the profile. */}
      <mesh position={[0.34, 0.16, 0.82]} rotation={[0, 0.35, 0.12]} scale={[0.26, 0.05, 0.09]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#140c09" roughness={0.7} />
      </mesh>
      <mesh position={[0.16, -0.06, 0.96]} rotation={[0.5, 0, 0]} scale={[0.1, 0.2, 0.14]}>
        <sphereGeometry args={[1, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* Neck and shoulders — the bust is what grounds the head in the frame. */}
      <mesh position={[0, -1.28, 0.04]} scale={[0.42, 0.5, 0.42]}>
        <cylinderGeometry args={[1, 1.05, 1, 24]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      <mesh position={[0, -2.35, 0]} scale={[1.85, 0.7, 1.05]}>
        <sphereGeometry args={[1, 36, 24]} />
        <meshStandardMaterial color="#170f0c" roughness={0.78} metalness={0.02} />
      </mesh>
    </group>
  )
}

/** Geometric objects drifting around the character, as in the reference. */
function FloatingShapes({ accent, active }: { accent: string; active: boolean }) {
  const groupRef = useRef<Group>(null)
  const shapes = useRef<Mesh[]>([])

  useFrame((state, delta) => {
    if (!active) return
    const t = state.clock.elapsedTime
    shapes.current.forEach((mesh, i) => {
      if (!mesh) return
      mesh.rotation.x += delta * (0.12 + i * 0.05)
      mesh.rotation.y += delta * (0.16 + i * 0.04)
      mesh.position.y += Math.sin(t * 0.5 + i * 2) * delta * 0.12
    })
    if (groupRef.current) {
      groupRef.current.rotation.y = state.pointer.x * 0.08
    }
  })

  const material = (
    <meshStandardMaterial color="#2a1a12" roughness={0.42} metalness={0.25} />
  )

  return (
    <group ref={groupRef}>
      <mesh
        ref={(m) => { if (m) shapes.current[0] = m }}
        position={[2.35, 1.55, -1.1]}
        scale={0.42}
      >
        <sphereGeometry args={[1, 32, 24]} />
        {material}
      </mesh>
      <mesh
        ref={(m) => { if (m) shapes.current[1] = m }}
        position={[2.15, -1.35, -0.5]}
        scale={0.34}
        rotation={[0.4, 0.6, 0.2]}
      >
        <boxGeometry args={[1, 1, 1]} />
        {material}
      </mesh>
      <mesh
        ref={(m) => { if (m) shapes.current[2] = m }}
        position={[-1.95, -1.5, -0.4]}
        scale={0.3}
        rotation={[1.1, 0.2, 0]}
      >
        <torusGeometry args={[1, 0.36, 16, 40]} />
        {material}
      </mesh>
    </group>
  )
}

export default function CharacterScene({
  active = true,
  reduced = false,
}: {
  active?: boolean
  reduced?: boolean
  /** Accepted for interface compatibility; this scene is not image-derived. */
  image?: string
  progressRef?: { current: number }
}) {
  const accent = useMemo(readAccent, [])
  const running = active && !reduced

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={running ? 'always' : 'demand'}
      camera={{ position: [0.35, 0.15, 11.5], fov: 38 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      {/*
        Lighting is the whole design. A very low ambient keeps the front of the
        subject nearly black; two warm lights behind it draw the rim that
        actually describes the shape; a dim cool fill stops the shadow side
        going completely flat.
      */}
      <ambientLight intensity={0.2} />
      <pointLight position={[4.2, 2.8, -3.4]} intensity={260} color={accent} distance={26} />
      <pointLight position={[-3.4, 1.0, -2.8]} intensity={110} color={accent} distance={22} />
      <pointLight position={[-4.2, 2.0, 4.4]} intensity={40} color="#9fb4ff" distance={24} />
      <directionalLight position={[1.5, 3, 2]} intensity={0.35} color="#ffd9b8" />
      <pointLight position={[3.6, 0.4, 2.2]} intensity={70} color="#ffb277" distance={18} />

      <Character accent={accent} active={running} />
      <FloatingShapes accent={accent} active={running} />
    </Canvas>
  )
}
