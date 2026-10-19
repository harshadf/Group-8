import React from 'react';
import { Sprout } from 'lucide-react';
import { Screen } from '../types.ts';

interface TopBarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isOnline?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentScreen,
  onNavigate,
  isOnline = true,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#f3fceb]/90 backdrop-blur-md px-4 py-3 border-b border-[#dce5d4]/60">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Lockup */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-full bg-[#dce7d4] flex items-center justify-center text-[#203916] shadow-sm">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-lexend font-bold text-xl tracking-tight text-[#161e13]">
            HappyPlant
          </span>
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              currentScreen === 'home-unavailable'
                ? 'bg-[#ba1a1a]'
                : isOnline
                ? 'bg-[#83bd75]'
                : 'bg-[#e89a3c]'
            }`}
            title={currentScreen === 'home-unavailable' ? 'Sensor Offline' : 'Sensor Online'}
          />
        </div>
      </div>
    </header>
  );
};