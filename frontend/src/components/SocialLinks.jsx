import { SOCIALS } from '../social'

// Inline SVGs so there's no icon-library dependency.
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.4c-1.3.1-2.5-.3-3.6-1v5.1c0 3-2 5.1-4.9 5.1-2.7 0-4.8-2-4.8-4.6 0-2.8 2.3-4.9 5.4-4.5v2.5c-.4-.1-.9-.2-1.3-.2-1.2 0-2.2.9-2.2 2 0 1.2.9 2.1 2.1 2.1 1.3 0 2.2-1 2.2-2.4V3h3.6z" />
    </svg>
  )
}

const ICONS = { instagram: InstagramIcon, tiktok: TikTokIcon }

// variant: "icons" (round icon buttons) or "labelled" (icon + handle text)
export default function SocialLinks({ variant = 'icons', className = '' }) {
  return (
    <div className={`socials socials-${variant} ${className}`}>
      {Object.entries(SOCIALS).map(([key, s]) => {
        const Icon = ICONS[key]
        return (
          <a
            key={key}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.label} (${s.handle})`}
            title={`${s.label} · ${s.handle}`}
          >
            <Icon />
            {variant === 'labelled' && <span>{s.handle}</span>}
          </a>
        )
      })}
    </div>
  )
}
