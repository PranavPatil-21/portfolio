import { SphereGeometry, BufferAttribute, Vector3 } from 'three'

/**
 * Builds a stylised head from a deformed sphere.
 *
 * A sphere alone reads as a ball, not a head. Four deformations do most of the
 * work of suggesting a skull: the cranium is widened and flattened at the back,
 * the lower half tapers to a jaw, the chin is pushed forward, and the face
 * plane is flattened slightly so the profile is not perfectly round.
 *
 * The result is deliberately low-detail. The design lights this from behind, so
 * what the viewer actually reads is the silhouette and the rim — surface detail
 * would be invisible and would only cost frames.
 */
export function buildHeadGeometry(segments = 64): SphereGeometry {
  const geometry = new SphereGeometry(1, segments, segments)
  const position = geometry.attributes.position as BufferAttribute
  const v = new Vector3()

  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i)

    // `t` runs 0 at the crown to 1 at the chin.
    const t = (1 - v.y) / 2

    // Jaw taper: narrow the lower half, most sharply toward the chin.
    const taper = t > 0.5 ? 1 - Math.pow((t - 0.5) * 2, 1.7) * 0.42 : 1
    v.x *= taper
    v.z *= taper

    // Cranium: slightly wider than deep, and flattened at the back.
    v.x *= 1.02
    if (v.z < 0) v.z *= 0.86

    // Chin: push the very bottom forward so the profile has a jawline.
    if (t > 0.72 && v.z > 0) {
      v.z += (t - 0.72) * 0.75
    }

    // Face plane: flatten the front very slightly, away from a perfect sphere.
    if (v.z > 0.55) v.z -= (v.z - 0.55) * 0.28

    // Overall proportion: heads are taller than they are wide.
    v.y *= 1.13

    position.setXYZ(i, v.x, v.y, v.z)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

export type HairTuft = { position: [number, number, number]; scale: number }

/**
 * Positions a cluster of spheres over the crown to suggest curly hair.
 *
 * Modelling hair properly is out of reach here; a cluster of overlapping
 * spheres is the standard stylised shorthand, and under a rim light it reads
 * convincingly because only the outline survives.
 *
 * Deterministic by design — a seeded generator rather than `Math.random` — so
 * the silhouette is identical on every render and between server and client.
 */
export function buildHair(count = 150, seed = 7): HairTuft[] {
  let s = seed
  const rand = () => {
    // Mulberry32: small, fast, and stable across engines.
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const tufts: HairTuft[] = []
  for (let i = 0; i < count; i += 1) {
    // Bias the distribution toward the top and back of the skull.
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(1 - rand() * 1.05) * 0.78

    const radius = 0.99 + rand() * 0.07
    const x = radius * Math.sin(phi) * Math.cos(theta) * 1.04
    const y = radius * Math.cos(phi) * 1.16 + 0.1
    const z = radius * Math.sin(phi) * Math.sin(theta) * 0.98

    // Keep tufts off the face: no hair growing out of the forehead downward.
    if (z > 0.45 && y < 0.62) continue

    tufts.push({
      position: [x, y, z],
      scale: 0.115 + rand() * 0.075,
    })
  }
  return tufts
}
