import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { colors } from '../theme';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const D = (p: IconProps) => ({
  size: p.size ?? 20,
  color: p.color ?? colors.inkTeal,
  strokeWidth: p.strokeWidth ?? 1.5,
});

export function ChevronRight(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 6 15 12 9 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VaultIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ScaleIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="5" y1="7" x2="19" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="8" y1="20" x2="16" y2="20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M5 7l-2.5 5h5L5 7Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M19 7l-2.5 5h5L19 7Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function ClipboardCheckIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="5" width="14" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth={strokeWidth} />
      <Polyline points="9 14 11 16 15 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GearIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CrescentIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  // Geometric Islamic crescent: outer disc with an offset disc subtracted
  // (using a single closed path so the crescent shape strokes/fills cleanly).
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4 A8 8 0 1 0 16 20 A6 6 0 1 1 16 4 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function MicIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="12" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="8" y1="22" x2="16" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PencilIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20h4l10-10-4-4L4 16v4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Line x1="13" y1="7" x2="17" y2="11" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function TrashIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="4 7 20 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Line x1="10" y1="11" x2="10" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="14" y1="11" x2="14" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ContactsIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx={12} cy={11} r={3} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M7 18c1-2 3-3 5-3s4 1 5 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function PhoneIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A14 14 0 0 1 4 6a2 2 0 0 1 2-2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function VolumeOnIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9v6h4l5 4V5L8 9H4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M16 8a5 5 0 0 1 0 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M19 5a9 9 0 0 1 0 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function VolumeOffIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9v6h4l5 4V5L8 9H4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Line x1="17" y1="9" x2="22" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="22" y1="9" x2="17" y2="14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function MapPinIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Circle cx={12} cy={9} r={2.5} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="5 12 10 17 19 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HeartPulseIcon(p: IconProps) {
  const { size, color, strokeWidth } = D(p);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 1.4-.5 2.7-1.2 3.9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="3 13 7 13 9 10 11 16 13 13 17 13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
