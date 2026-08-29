import { ImageResponse } from 'next/og'
import { getSettings } from '@/content'

/**
 * The social sharing card. Regenerated at build time from `settings.json`, so
 * editing the name, first role or accent colour in the CMS updates the card
 * without a code change.
 *
 * `ImageResponse` supports a subset of CSS and no class names — every style
 * here is inline by necessity, not by preference.
 */

export const alt = 'Portfolio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const settings = getSettings()
  const { accent, background, foreground } = settings.theme

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background,
          color: foreground,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '10px',
            borderRadius: '999px',
            background: accent,
            marginBottom: '48px',
          }}
        />
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: '-0.03em' }}>
          {settings.name}
        </div>
        <div style={{ fontSize: 44, marginTop: '20px', color: accent }}>
          {settings.roles[0]}
        </div>
        {settings.location ? (
          <div style={{ fontSize: 30, marginTop: '32px', opacity: 0.65 }}>
            {settings.location}
          </div>
        ) : null}
      </div>
    ),
    size,
  )
}
