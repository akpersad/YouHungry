/**
 * App Mascot - "Nibbles"
 *
 * A playful food-themed character for error pages and empty states
 * Inspired by GitHub's Octocat with multiple poses
 */

interface MascotProps {
  pose?: 'confused' | 'searching' | 'sad' | 'thinking' | 'waving';
  size?: number;
  className?: string;
}

export function Mascot({
  pose = 'confused',
  size = 200,
  className = '',
}: MascotProps) {
  const poses = {
    confused: (
      <g id="confused">
        {/* Body - burger */}
        <ellipse cx="100" cy="120" rx="80" ry="60" fill="#FFE5B4" />
        <ellipse cx="100" cy="115" rx="75" ry="10" fill="#F4A460" />
        <ellipse cx="100" cy="125" rx="75" ry="10" fill="#F4A460" />

        {/* Sesame seeds */}
        <circle cx="70" cy="100" r="3" fill="#E8C87C" />
        <circle cx="90" cy="95" r="3" fill="#E8C87C" />
        <circle cx="110" cy="98" r="3" fill="#E8C87C" />
        <circle cx="130" cy="103" r="3" fill="#E8C87C" />

        {/* Eyes - confused */}
        <ellipse cx="75" cy="110" rx="8" ry="12" fill="#2C1810" />
        <ellipse cx="125" cy="110" rx="8" ry="12" fill="#2C1810" />
        <circle cx="77" cy="108" r="3" fill="#FFFFFF" />
        <circle cx="127" cy="108" r="3" fill="#FFFFFF" />

        {/* Mouth - confused wavy line */}
        <path
          d="M 75 135 Q 85 130 95 135 T 115 135"
          stroke="#2C1810"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms */}
        <ellipse
          cx="35"
          cy="130"
          rx="15"
          ry="8"
          fill="#FFD9A0"
          transform="rotate(-20 35 130)"
        />
        <ellipse
          cx="165"
          cy="130"
          rx="15"
          ry="8"
          fill="#FFD9A0"
          transform="rotate(20 165 130)"
        />

        {/* Question mark above head */}
        <text
          x="100"
          y="70"
          fontSize="40"
          fill="#FF6B6B"
          textAnchor="middle"
          fontWeight="bold"
        >
          ?
        </text>
      </g>
    ),

    searching: (
      <g id="searching">
        {/* Body */}
        <ellipse cx="100" cy="120" rx="80" ry="60" fill="#FFE5B4" />
        <ellipse cx="100" cy="115" rx="75" ry="10" fill="#F4A460" />
        <ellipse cx="100" cy="125" rx="75" ry="10" fill="#F4A460" />

        {/* Sesame seeds */}
        <circle cx="70" cy="100" r="3" fill="#E8C87C" />
        <circle cx="90" cy="95" r="3" fill="#E8C87C" />
        <circle cx="110" cy="98" r="3" fill="#E8C87C" />
        <circle cx="130" cy="103" r="3" fill="#E8C87C" />

        {/* Eyes - looking to the side */}
        <circle cx="72" cy="110" r="10" fill="#2C1810" />
        <circle cx="122" cy="110" r="10" fill="#2C1810" />
        <circle cx="74" cy="108" r="4" fill="#FFFFFF" />
        <circle cx="124" cy="108" r="4" fill="#FFFFFF" />

        {/* Mouth - small o */}
        <circle cx="100" cy="135" r="5" fill="#2C1810" />

        {/* Magnifying glass */}
        <circle
          cx="160"
          cy="90"
          r="20"
          fill="none"
          stroke="#4A90E2"
          strokeWidth="4"
        />
        <line
          x1="175"
          y1="105"
          x2="195"
          y2="125"
          stroke="#4A90E2"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    ),

    sad: (
      <g id="sad">
        {/* Body */}
        <ellipse cx="100" cy="120" rx="80" ry="60" fill="#FFE5B4" />
        <ellipse cx="100" cy="115" rx="75" ry="10" fill="#F4A460" />
        <ellipse cx="100" cy="125" rx="75" ry="10" fill="#F4A460" />

        {/* Sesame seeds */}
        <circle cx="70" cy="100" r="3" fill="#E8C87C" />
        <circle cx="90" cy="95" r="3" fill="#E8C87C" />
        <circle cx="110" cy="98" r="3" fill="#E8C87C" />
        <circle cx="130" cy="103" r="3" fill="#E8C87C" />

        {/* Eyes - sad */}
        <circle cx="75" cy="110" r="10" fill="#2C1810" />
        <circle cx="125" cy="110" r="10" fill="#2C1810" />
        <circle cx="75" cy="108" r="4" fill="#FFFFFF" />
        <circle cx="125" cy="108" r="4" fill="#FFFFFF" />

        {/* Sad eyebrows */}
        <path
          d="M 65 95 Q 75 100 85 95"
          stroke="#2C1810"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 115 95 Q 125 100 135 95"
          stroke="#2C1810"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Mouth - sad frown */}
        <path
          d="M 80 140 Q 100 135 120 140"
          stroke="#2C1810"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Tear */}
        <ellipse cx="135" cy="120" rx="3" ry="6" fill="#6BB6FF" />
      </g>
    ),

    thinking: (
      <g id="thinking">
        {/* Body */}
        <ellipse cx="100" cy="120" rx="80" ry="60" fill="#FFE5B4" />
        <ellipse cx="100" cy="115" rx="75" ry="10" fill="#F4A460" />
        <ellipse cx="100" cy="125" rx="75" ry="10" fill="#F4A460" />

        {/* Sesame seeds */}
        <circle cx="70" cy="100" r="3" fill="#E8C87C" />
        <circle cx="90" cy="95" r="3" fill="#E8C87C" />
        <circle cx="110" cy="98" r="3" fill="#E8C87C" />
        <circle cx="130" cy="103" r="3" fill="#E8C87C" />

        {/* Eyes - looking up */}
        <circle cx="75" cy="105" r="10" fill="#2C1810" />
        <circle cx="125" cy="105" r="10" fill="#2C1810" />
        <circle cx="75" cy="102" r="4" fill="#FFFFFF" />
        <circle cx="125" cy="102" r="4" fill="#FFFFFF" />

        {/* Mouth - hmm */}
        <line
          x1="85"
          y1="135"
          x2="115"
          y2="135"
          stroke="#2C1810"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Thought bubbles */}
        <circle cx="140" cy="75" r="8" fill="#E0E0E0" />
        <circle cx="155" cy="60" r="6" fill="#E0E0E0" />
        <circle cx="165" cy="45" r="4" fill="#E0E0E0" />
      </g>
    ),

    waving: (
      <g id="waving">
        {/* Body */}
        <ellipse cx="100" cy="120" rx="80" ry="60" fill="#FFE5B4" />
        <ellipse cx="100" cy="115" rx="75" ry="10" fill="#F4A460" />
        <ellipse cx="100" cy="125" rx="75" ry="10" fill="#F4A460" />

        {/* Sesame seeds */}
        <circle cx="70" cy="100" r="3" fill="#E8C87C" />
        <circle cx="90" cy="95" r="3" fill="#E8C87C" />
        <circle cx="110" cy="98" r="3" fill="#E8C87C" />
        <circle cx="130" cy="103" r="3" fill="#E8C87C" />

        {/* Eyes - happy */}
        <path
          d="M 65 110 Q 75 105 85 110"
          stroke="#2C1810"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 115 110 Q 125 105 135 110"
          stroke="#2C1810"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Mouth - smile */}
        <path
          d="M 80 130 Q 100 140 120 130"
          stroke="#2C1810"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Waving arm */}
        <ellipse
          cx="170"
          cy="100"
          rx="15"
          ry="8"
          fill="#FFD9A0"
          transform="rotate(-45 170 100)"
        />

        {/* Wave lines */}
        <path
          d="M 185 85 Q 190 80 195 85"
          stroke="#FFA500"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 190 90 Q 195 85 200 90"
          stroke="#FFA500"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {poses[pose]}
    </svg>
  );
}
