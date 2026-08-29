/**
 * Film grain overlay.
 *
 * All of the appearance lives in the `.grain-overlay` rule in `globals.css`
 * (fixed, `contain: strict`, ~4.5% opacity noise). This component exists only
 * so the layer can be dropped into a tree as a named thing, and so the
 * `aria-hidden` is stated once rather than at every call site — it is texture,
 * not content, and has no business in the accessibility tree.
 */
export default function Grain() {
  return <div className="grain-overlay" aria-hidden="true" />
}
