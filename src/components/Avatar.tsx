import { useMemo } from 'react';

interface AvatarProps {
  username: string;
  avatarColor?: string;
  size?: number;
}

export function Avatar({ username, avatarColor = '#10b981', size = 32 }: AvatarProps) {
  // Hash function to get stable random traits from the username
  const traits = useMemo(() => {
    let hash = 0;
    const name = username || 'User';
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const eyeType = Math.abs(hash >> 2) % 4;
    const mouthType = Math.abs(hash >> 4) % 4;
    const accessoryType = Math.abs(hash >> 6) % 4;
    
    // Create a matching secondary color for gradient mapping
    const baseColor = avatarColor;
    const secondaryColor = adjustBrightness(baseColor, -35);

    return {
      eyeType,
      mouthType,
      accessoryType,
      baseColor,
      secondaryColor
    };
  }, [username, avatarColor]);

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className="rounded-full shadow-lg border border-white/20 shrink-0"
    >
      <defs>
        <linearGradient id={`avatar-grad-${username}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={traits.baseColor} />
          <stop offset="100%" stopColor={traits.secondaryColor} />
        </linearGradient>
      </defs>
      
      {/* 3D Liquid Sphere Base */}
      <circle cx="50" cy="50" r="49" fill={`url(#avatar-grad-${username})`} />
      
      {/* Dynamic Features */}
      <g>
        {/* Accessory layer (glasses, blush cheeks, nose) */}
        {traits.accessoryType === 0 && (
          <>
            {/* Blush cheeks */}
            <circle cx="22" cy="58" r="6" fill="white" opacity="0.25" />
            <circle cx="78" cy="58" r="6" fill="white" opacity="0.25" />
          </>
        )}
        {traits.accessoryType === 1 && (
          /* Nose */
          <path d="M 48 48 Q 50 56 46 56" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
        )}
        {traits.accessoryType === 2 && (
          /* Cool sunglasses */
          <>
            <circle cx="34" cy="45" r="13" fill="#0d0d0d" stroke="white" strokeWidth="2.5" />
            <circle cx="66" cy="45" r="13" fill="#0d0d0d" stroke="white" strokeWidth="2.5" />
            <line x1="47" y1="44" x2="53" y2="44" stroke="white" strokeWidth="3" />
            {/* Glare line */}
            <path d="M 28 40 L 36 48" stroke="white" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
            <path d="M 60 40 L 68 48" stroke="white" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
          </>
        )}

        {/* Eyes layer (if sunglasses are not active) */}
        {traits.accessoryType !== 2 && (
          <>
            {traits.eyeType === 0 && (
              <>
                {/* Anime sparkling eyes */}
                <circle cx="34" cy="44" r="7" fill="white" />
                <circle cx="32" cy="42" r="2.5" fill="black" />
                <circle cx="36" cy="46" r="1" fill="white" />
                <circle cx="66" cy="44" r="7" fill="white" />
                <circle cx="64" cy="42" r="2.5" fill="black" />
                <circle cx="68" cy="46" r="1" fill="white" />
              </>
            )}
            {traits.eyeType === 1 && (
              <>
                {/* Clean circles */}
                <circle cx="34" cy="44" r="5" fill="white" />
                <circle cx="66" cy="44" r="5" fill="white" />
              </>
            )}
            {traits.eyeType === 2 && (
              <>
                {/* Wink eye right */}
                <circle cx="34" cy="44" r="5" fill="white" />
                <path d="M 59 45 Q 66 38 73 45" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </>
            )}
            {traits.eyeType === 3 && (
              <>
                {/* Happy arched lines */}
                <path d="M 27 46 Q 34 38 41 46" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M 59 46 Q 66 38 73 46" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </>
            )}
          </>
        )}

        {/* Mouth layer */}
        {traits.mouthType === 0 && (
          /* Smiling curve */
          <path d="M 36 65 Q 50 76 64 65" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {traits.mouthType === 1 && (
          /* Whistling circle */
          <circle cx="50" cy="66" r="5" stroke="white" strokeWidth="3.5" fill="none" />
        )}
        {traits.mouthType === 2 && (
          /* Laughing mouth open */
          <>
            <path d="M 38 62 Q 50 72 62 62 Z" fill="white" />
            <path d="M 44 67 Q 50 72 56 67" fill="rose" opacity="0.6" />
          </>
        )}
        {traits.mouthType === 3 && (
          /* Neutral face line */
          <line x1="38" y1="65" x2="62" y2="65" stroke="white" strokeWidth="4" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}

// Color helper to darken/lighten gradients
function adjustBrightness(hex: string, percent: number) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(((R * (100 + percent)) / 100).toString());
  G = parseInt(((G * (100 + percent)) / 100).toString());
  B = parseInt(((B * (100 + percent)) / 100).toString());

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
