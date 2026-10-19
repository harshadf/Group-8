import React from 'react';

export type PlantMood =
  | 'healthy'
  | 'sleeping'
  | 'unavailable'
  | 'thirsty'
  | 'cold'
  | 'hot'
  | 'dry'
  | 'humid';

interface PlantCharacterProps {
  mood: PlantMood;
  className?: string;
}

export const PlantCharacter: React.FC<PlantCharacterProps> = ({ mood, className = 'w-44 h-44' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Decorative Environmental Effects based on mood */}
      {mood === 'cold' && (
        <svg
          className="absolute -top-1 w-36 h-28 pointer-events-none text-[#75b2c7] animate-pulse"
          viewBox="0 0 120 70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          {/* Shiver waves left */}
          <path d="M 15 25 C 22 20, 24 35, 30 30" opacity="0.8" />
          <path d="M 20 45 C 27 40, 29 55, 35 50" opacity="0.6" />
          {/* Shiver waves right */}
          <path d="M 90 25 C 97 20, 99 35, 105 30" opacity="0.8" />
          <path d="M 85 45 C 92 40, 94 55, 100 50" opacity="0.6" />
        </svg>
      )}

      {mood === 'hot' && (
        <svg
          className="absolute -top-2 w-32 h-20 pointer-events-none text-[#f39c42]"
          viewBox="0 0 100 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          {/* Heat waves */}
          <path d="M 25 35 Q 28 20 25 10" opacity="0.8" />
          <path d="M 50 30 Q 53 15 50 5" opacity="0.9" />
          <path d="M 75 35 Q 78 20 75 10" opacity="0.8" />
        </svg>
      )}

      {mood === 'humid' && (
        <svg
          className="absolute -top-2 w-36 h-24 pointer-events-none text-[#66afca]"
          viewBox="0 0 120 70"
          fill="none"
        >
          {/* Water vapor wisps */}
          <path
            d="M 22 25 C 26 15, 35 15, 38 25"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M 82 25 C 86 15, 95 15, 98 25"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Droplets on foliage */}
          <circle cx="48" cy="18" r="2.5" fill="#58a4c1" />
          <circle cx="72" cy="22" r="2.5" fill="#58a4c1" />
        </svg>
      )}

      {/* Main Plant & Pot Illustration */}
      <svg
        viewBox="0 0 160 170"
        className="w-full h-full drop-shadow-sm select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* === FOLIAGE / STEMS === */}
        {mood === 'sleeping' ? (
          <g>
            <path
              d="M 80 82 L 80 42"
              stroke="#628549"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Left little leaf */}
            <path
              d="M 80 50 C 65 42 62 60 80 56 Z"
              fill="#86ab6a"
            />
            {/* Right little leaf */}
            <path
              d="M 80 44 C 95 36 98 54 80 50 Z"
              fill="#9bc27d"
            />
          </g>
        ) : (
          <g>
            {/* Main Central Stem */}
            <path
              d="M 80 82 L 80 32"
              stroke="#436830"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Top Leaf */}
            <path
              d="M 80 34 C 74 16 86 16 80 34"
              stroke="#537b3f"
              strokeWidth="3"
            />
            <path
              d="M 80 18 C 72 26 76 42 80 44 C 84 42 88 26 80 18 Z"
              fill="#5f884a"
            />

            {/* Left Large Leaf */}
            <path
              d={
                mood === 'thirsty'
                  ? 'M 80 58 C 55 58 40 82 48 92 C 58 92 78 72 80 58 Z' // droopy
                  : 'M 80 58 C 48 46 42 68 55 76 C 68 76 78 68 80 58 Z'
              }
              fill="#4f753a"
            />

            {/* Right Large Leaf */}
            <path
              d={
                mood === 'thirsty'
                  ? 'M 80 58 C 105 58 120 82 112 92 C 102 92 82 72 80 58 Z' // droopy
                  : 'M 80 58 C 112 46 118 68 105 76 C 92 76 82 68 80 58 Z'
              }
              fill="#5b8344"
            />
          </g>
        )}

        {/* === TERRACOTTA POT === */}
        {/* Pot Rim */}
        <rect
          x="44"
          y="78"
          width="72"
          height="14"
          rx="4"
          fill="#c06029"
        />
        {/* Pot Body */}
        <path
          d="M 48 90 L 55 138 C 56 142 60 145 64 145 L 96 145 C 100 145 104 142 105 138 L 112 90 Z"
          fill="#cc6b33"
        />
        {/* Soft shadow on pot edge */}
        <path
          d="M 104 90 L 98 138 C 98 141 100 144 102 144 L 96 145 C 100 145 104 142 105 138 L 112 90 Z"
          fill="#b35623"
          opacity="0.3"
        />

        {/* === FACE EXPRESSIONS === */}
        {mood === 'healthy' && (
          <g>
            {/* Left Eye */}
            <path
              d="M 64 108 Q 69 104 74 108"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Right Eye */}
            <path
              d="M 86 108 Q 91 104 96 108"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Cheeks */}
            <circle cx="63" cy="115" r="4" fill="#f09689" opacity="0.6" />
            <circle cx="97" cy="115" r="4" fill="#f09689" opacity="0.6" />
            {/* Smile */}
            <path
              d="M 76 116 Q 80 122 84 116"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {mood === 'sleeping' && (
          <g>
            {/* Left Eye */}
            <path
              d="M 64 109 Q 69 113 74 109"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Right Eye */}
            <path
              d="M 86 109 Q 91 113 96 109"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Gentle smile */}
            <path
              d="M 76 117 Q 80 120 84 117"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {mood === 'unavailable' && (
          <g>
            <circle cx="69" cy="108" r="2.8" fill="#26170d" />
            <circle cx="91" cy="108" r="2.8" fill="#26170d" />
            {/* Straight mouth */}
            <path
              d="M 75 118 L 85 118"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {mood === 'thirsty' && (
          <g>
            <circle cx="69" cy="108" r="2.8" fill="#26170d" />
            <circle cx="91" cy="108" r="2.8" fill="#26170d" />
            {/* Sad downturned mouth */}
            <path
              d="M 75 120 Q 80 115 85 120"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Sweat drop on pot */}
            <path
              d="M 98 100 C 96 105 101 108 103 105 C 105 102 99 97 98 100 Z"
              fill="#62b5d4"
            />
          </g>
        )}

        {mood === 'cold' && (
          <g>
            <circle cx="69" cy="108" r="2.8" fill="#26170d" />
            <circle cx="91" cy="108" r="2.8" fill="#26170d" />
            {/* Rosy cold cheeks */}
            <circle cx="63" cy="114" r="5" fill="#f87171" opacity="0.8" />
            <circle cx="97" cy="114" r="5" fill="#f87171" opacity="0.8" />
            {/* Wavy shivering mouth */}
            <path
              d="M 74 119 Q 77 116 80 119 Q 83 122 86 119"
              stroke="#26170d"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        )}

        {mood === 'hot' && (
          <g>
            <path
              d="M 64 108 Q 69 104 74 108"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 86 108 Q 91 104 96 108"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Warm flush cheeks */}
            <circle cx="63" cy="115" r="5" fill="#f97316" opacity="0.6" />
            <circle cx="97" cy="115" r="5" fill="#f97316" opacity="0.6" />
            {/* Slightly panting smile */}
            <path
              d="M 75 116 Q 80 123 85 116"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Sweat droplet */}
            <path
              d="M 99 98 C 97 103 102 106 104 103 C 106 100 100 95 99 98 Z"
              fill="#62b5d4"
            />
          </g>
        )}

        {mood === 'dry' && (
          <g>
            <circle cx="69" cy="108" r="2.8" fill="#26170d" />
            <circle cx="91" cy="108" r="2.8" fill="#26170d" />
            <circle cx="64" cy="115" r="4" fill="#e0a180" opacity="0.5" />
            <circle cx="96" cy="115" r="4" fill="#e0a180" opacity="0.5" />
            {/* Neutral slightly curved line */}
            <path
              d="M 75 118 Q 80 119 85 118"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {mood === 'humid' && (
          <g>
            <path
              d="M 64 108 Q 69 104 74 108"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 86 108 Q 91 104 96 108"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Cheeks */}
            <circle cx="63" cy="115" r="4" fill="#f09689" opacity="0.6" />
            <circle cx="97" cy="115" r="4" fill="#f09689" opacity="0.6" />
            {/* Smile */}
            <path
              d="M 75 116 Q 80 123 85 116"
              stroke="#26170d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Condensation droplet on pot */}
            <circle cx="80" cy="101" r="2" fill="#58a4c1" />
          </g>
        )}
      </svg>
    </div>
  );
};
