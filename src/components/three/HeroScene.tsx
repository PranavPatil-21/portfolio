'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  Object3D,
  Vector3,
} from 'three'

/**
 * A distorted icosahedron wrapped in a drifting particle field that eases
 * toward the cursor. Deliberately cheap: one distorted mesh, one instanced
 * mesh, no shadows, no post-processing, antialiasing off.
 */

const FALLBACK_ACCENT = '#7c5cff'

/** Themed from the live CSS variable so a CMS colour change flows through. */
function readAccent(): string {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return FALLBACK_ACCENT
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  return value || FALLBACK_ACCENT
}

/** Low-core machines are usually low-GPU machines too. */
function particleCount(): number {
  const cores =
    typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : 8
  return cores <= 4 ? 260 : 900
}

type SeededParticle = { base: Vector3; drift: Vector3; scale: number; phase: number }

function Particles({ accent, count }: { accent: string; count: number }) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const pointer = useMemo(() => new Vector3(), [])

  const seeds = useMemo<SeededParticle[]>(
    () =>
      Array.from({ length: count }, () => {
        const radius = 2.2 + Math.random() * 2.6
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        return {
          base: new Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta) * 0.62,
            radius * Math.cos(phi),
          ),
          drift: new Vector3(
            (Math.random() - 0.5) * 0.35,
            (Math.random() - 0.5) * 0.35,
            (Math.random() - 0.5) * 0.35,
          ),
          scale: 0.012 + Math.random() * 0.026,
          phase: Math.random() * Math.PI * 2,
        }
      }),
    [count],
  )

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Ease the attractor toward the cursor rather than snapping to it.
    pointer.lerp(
      new Vector3(state.pointer.x * 2.6, state.pointer.y * 1.6, 0),
      0.045,
    )
    const t = state.clock.elapsedTime

    for (let i = 0; i < seeds.length; i += 1) {
      const seed = seeds[i]
      const wobble = Math.sin(t * 0.4 + seed.phase)
      const x = seed.base.x + seed.drift.x * wobble
      const y = seed.base.y + seed.drift.y * Math.cos(t * 0.33 + seed.phase)
      const z = seed.base.z + seed.drift.z * wobble

      // Pull is strongest for particles already near the cursor.
      const pull = 0.5 / (1 + pointer.distanceToSquared(new Vector3(x, y, z)))
      dummy.position.set(
        MathUtils.lerp(x, pointer.x, pull),
        MathUtils.lerp(y, pointer.y, pull),
        z,
      )
      dummy.scale.setScalar(seed.scale * (1 + pull * 2))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.rotation.y = t * 0.03
  })

  // Instanced meshes start with an identity matrix per instance; seed them so a
  // single reduced-motion frame still shows the field in position.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const matrix = new Matrix4()
    seeds.forEach((seed, i) => {
      matrix.makeScale(seed.scale, seed.scale, seed.scale).setPosition(seed.base)
      mesh.setMatrixAt(i, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [seeds])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, seeds.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={accent}
        transparent
        opacity={0.75}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

function Blob({ accent, active }: { accent: string; active: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const { pointer } = useThree()

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.y += delta * 0.12
    mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, pointer.y * 0.35, 0.04)
    mesh.position.x = MathUtils.lerp(mesh.position.x, pointer.x * 0.3, 0.04)
    mesh.position.y = MathUtils.lerp(
      mesh.position.y,
      Math.sin(state.clock.elapsedTime * 0.6) * 0.08,
      0.04,
    )
  })

  return (
    <Icosahedron ref={meshRef} args={[1.35, 12]}>
      <MeshDistortMaterial
        color={accent}
        distort={active ? 0.42 : 0.22}
        speed={active ? 1.6 : 0}
        roughness={0.25}
        metalness={0.65}
        emissive={new Color(accent)}
        emissiveIntensity={0.18}
      />
    </Icosahedron>
  )
}

export default function HeroScene({
  active = true,
  reduced = false,
}: {
  active?: boolean
  reduced?: boolean
}) {
  const accent = useMemo(readAccent, [])
  const count = useMemo(particleCount, [])

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 4, 5]} intensity={45} color={accent} />
      <pointLight position={[-5, -3, 2]} intensity={18} color="#ffffff" />
      <Blob accent={accent} active={!reduced} />
      <Particles accent={accent} count={reduced ? Math.min(count, 300) : count} />
    </Canvas>
  )
}
