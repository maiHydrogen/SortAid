// Small shared icon set used across the revamped UI.
// All icons are hand-drawn inline SVGs so the app has zero external asset
// dependencies (no downloads, no licensing questions).
import React from "react";

export const LogoMark = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 1.5L4 20h4.6l1.1-3h4.6l1.1 3H20L12 1.5z" fill="#3fae54" opacity="0.95" />
    <path d="M12 1.5L6.7 15h4.4L12 1.5z" fill="#4f6bf0" />
    <path d="M12 1.5L17.3 15h-4.4L12 1.5z" fill="#e8482a" />
  </svg>
);

export const ChevronRight = ({ size = 18, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={style}>
    <path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronDoubleDown = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 14l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FunnelPlus = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3.5 5h17l-6.2 7.2v5.3l-4.6 2.2v-7.5L3.5 5z"
      stroke={color}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

export const CircleX = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
    <path d="M9.5 9.5l5 5m0-5l-5 5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);

export const KeyIcon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="8" cy="15" r="4" stroke={color} strokeWidth={1.8} />
    <path d="M11 12l9-9m0 0v4.5M20 3h-4.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const UserCircle = ({ size = 22, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.4" stroke={color} strokeWidth={1.7} />
    <path d="M5 19.2c1.4-3 4-4.4 7-4.4s5.6 1.4 7 4.4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </svg>
);

export const GithubMark = ({ size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 .5C5.7.5.7 5.6.7 12c0 5.1 3.3 9.4 7.9 11 .6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.6 7.9-5.9 7.9-11C23.3 5.6 18.3.5 12 .5z" />
  </svg>
);

export const GoogleMark = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.5-6.5C35.2 2.6 30 .5 24 .5 14.9.5 7.1 5.7 3.3 13.2l7.6 5.9C12.7 13.1 17.9 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z" />
    <path fill="#FBBC05" d="M10.9 19.1c-.5 1.5-.8 3.1-.8 4.9s.3 3.4.8 4.9l-7.6 5.9C1.5 31.5.5 27.9.5 24s1-7.5 2.8-10.8l7.6 5.9z" />
    <path fill="#34A853" d="M24 47.5c6 0 11.1-2 14.8-5.4l-7.3-5.7c-2 1.4-4.6 2.2-7.5 2.2-6.1 0-11.3-3.6-13.1-8.6l-7.6 5.9C7.1 42.3 14.9 47.5 24 47.5z" />
  </svg>
);

export const AppleMark = ({ size = 18, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M16.4 1.3c.1 1.1-.3 2.2-1 3-.7.8-1.9 1.5-3 1.4-.1-1.1.4-2.2 1-2.9.8-.9 2-1.5 3-1.5zM20 17.2c-.5 1.1-.7 1.6-1.4 2.6-.9 1.4-2.2 3.2-3.9 3.2-1.4.1-1.8-.9-3.7-.9s-2.4 1-3.8.9c-1.6-.1-2.9-1.6-3.8-3-2.6-4-2.9-8.7-1.3-11.2 1.1-1.8 2.9-2.9 4.6-2.9 1.7 0 2.8 1 4.2 1s2.2-1 4.2-.9c1.3.1 3.2.6 4.2 2.1-3.7 2.2-3.1 7.4.7 9.1z" />
  </svg>
);
