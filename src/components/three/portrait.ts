/**
 * Turns a photograph into a point cloud.
 *
 * The image is drawn to an offscreen canvas, read back as pixels, and sampled
 * on a grid. Each surviving pixel becomes one particle: its position comes from
 * where it sat in the image, its depth from how bright it is, and its colour
 * from the pixel itself. Dark pixels are dropped, which both isolates the
 * subject from a dim background and keeps the particle count affordable.
 *
 * This runs entirely in the browser against a same-origin image — no build
 * step, no model, no service. The trade-off is that "depth from luminance" is
 * an approximation of real depth: it reads well for a lit subject on a darker
 * background, which is the case we have.
 */

export type PortraitCloud = {
  positions: Float32Array
  colors: Float32Array
  scatter: Float32Array
  seeds: Float32Array
  count: number
  aspect: number
}

export type SampleOptions = {
  /** Target particle count. Actual count lands near this after dark pixels drop. */
  target?: number
  /** Pixels dimmer than this (0–1) are discarded. */
  luminanceFloor?: number
  /** World-space height of the portrait. */
  height?: number
  /** How far bright pixels push toward the viewer. */
  depth?: number
  /**
   * Elliptical subject mask, in normalised image coordinates.
   *
   * A photo taken in a room brings the room with it — shelves and clutter
   * become particles indistinguishable from the subject, and the result reads
   * as noise rather than a portrait. Proper segmentation needs a model we are
   * not going to ship; an ellipse centred on the subject removes most of the
   * background for none of the cost, and the soft edge makes the cut look
   * deliberate rather than clipped.
   */
  focus?: { x: number; y: number; rx: number; ry: number; feather: number }
}

/**
 * Deterministic hash in [0,1). Used for the probabilistic edge dissolve so the
 * mask boundary is a scatter of particles rather than a hard ellipse.
 */
function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

/**
 * Chooses a sampling stride that lands near the requested particle count.
 *
 * Sampling every pixel of a 651×800 image would mean half a million particles;
 * stepping the grid is what keeps this real-time on a laptop GPU.
 */
export function strideFor(width: number, height: number, target: number): number {
  return Math.max(1, Math.round(Math.sqrt((width * height) / Math.max(1, target))))
}

export function buildCloud(
  image: ImageData,
  {
    target = 40_000,
    luminanceFloor = 0.17,
    height = 4.0,
    depth = 0.38,
    focus = { x: 0.645, y: 0.25, rx: 0.28, ry: 0.31, feather: 0.3 },
  }: SampleOptions = {},
): PortraitCloud {
  const { width, height: imgHeight, data } = image

  /*
   * Size the sampling grid for the pixels we will actually keep, not for the
   * whole image.
   *
   * The focus ellipse discards most of the frame and the luminance floor takes
   * a further slice. Choosing a stride from the full image area therefore
   * undershoots the target badly — the face ends up starved of particles and
   * fragments. Estimate the surviving fraction analytically (ellipse area, then
   * an empirical allowance for the luminance cut) and sample that much denser.
   */
  const keptFraction = Math.max(0.05, Math.PI * focus.rx * focus.ry * 0.75)
  const stride = strideFor(width, imgHeight, target / keptFraction)
  const scale = height / imgHeight
  const aspect = width / imgHeight

  const positions: number[] = []
  const colors: number[] = []
  const scatter: number[] = []
  const seeds: number[] = []

  for (let gy = 0; gy < imgHeight; gy += stride) {
    for (let gx = 0; gx < width; gx += stride) {
      /*
       * Jitter each sample inside its grid cell.
       *
       * Sampling on an exact lattice beats against any regular pattern in the
       * photograph — a striped shirt aliases into concentric rings that look
       * like a rendering bug rather than clothing. Breaking the lattice
       * removes the moiré at no cost.
       */
      const x = Math.min(width - 1, gx + Math.floor(Math.random() * stride))
      const y = Math.min(imgHeight - 1, gy + Math.floor(Math.random() * stride))
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const alpha = data[i + 3]
      if (alpha < 8) continue

      const lum = luminance(r, g, b)
      if (lum < luminanceFloor) continue

      // Elliptical subject mask with a dissolving edge.
      const nx = (x / width - focus.x) / focus.rx
      const ny = (y / imgHeight - focus.y) / focus.ry
      const radial = Math.sqrt(nx * nx + ny * ny)
      if (radial > 1) continue
      const edge = (1 - radial) / focus.feather
      if (edge < 1 && hash(x, y) > edge) continue

      positions.push(
        (x - width / 2) * scale,
        -(y - imgHeight / 2) * scale,
        (lum - 0.5) * depth,
      )
      colors.push(r / 255, g / 255, b / 255)

      // Scattered start: a loose shell the cloud collapses inward from.
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 4 + Math.random() * 5
      scatter.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi) - 2,
      )

      // Per-particle randomness: staggers the assembly and varies drift.
      seeds.push(Math.random())
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    scatter: new Float32Array(scatter),
    seeds: new Float32Array(seeds),
    count: seeds.length,
    aspect,
  }
}

/** Reads an image into pixel data. Rejects rather than throwing asynchronously. */
export function loadImageData(src: string, maxWidth = 520): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onerror = () => reject(new Error(`Could not load portrait image: ${src}`))
    img.onload = () => {
      // Downscale first: we only need enough resolution to sample a grid from,
      // and decoding a 3000px image into a canvas is wasted work and memory.
      const ratio = Math.min(1, maxWidth / img.naturalWidth)
      const w = Math.max(1, Math.round(img.naturalWidth * ratio))
      const h = Math.max(1, Math.round(img.naturalHeight * ratio))

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('2D canvas context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(ctx.getImageData(0, 0, w, h))
    }
    img.src = src
  })
}
