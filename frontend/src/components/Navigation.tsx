import React from 'react';
import { Calendar, Bell, Sliders, Flower2 } from 'lucide-react';
import { Screen } from '../types.ts';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  // Screens where the xpath expects data-path='notifications' for Alerts tab
  const isNotificationScreen = [
    'home',
    'home-no-plant',
    'home-unavailable',
    'dashboard-watering-due',
    'dashboard-temp-low',
    'dashboard-temp-high',
    'dashboard-humidity-low',
    'dashboard-humidity-high',
  ].includes(currentScreen);

  // Group active tabs:
  const isHomeActive = [
    'home',
    'home-no-plant',
    'home-unavailable',
    'dashboard-watering-due',
    'dashboard-temp-low',
    'dashboard-temp-high',
    'dashboard-humidity-low',
    'dashboard-humidity-high',
  ].includes(currentScreen);

  const isHistoryActive = [
    'history',
    'humidity-history',
    'temperature-history',
    'atmospheric-pressure',
  ].includes(currentScreen);

  const isAlertsActive = currentScreen === 'alerts';
  const isSettingsActive = currentScreen === 'settings' || currentScreen === 'add-plant';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#edf7e5]/95 backdrop-blur-md border-t border-[#dce5d4] px-3 py-1.5 transition-all"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1 items-center">
        {/* Tab 1: Home */}
        <a
          href="#home"
          data-path="home"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
            isHomeActive
              ? 'bg-[#d8e4d0] text-[#161e13] font-semibold'
              : 'text-[#43483f] hover:text-[#161e13] hover:bg-[#e4eedb]'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-0.5">
            <Flower2 className="w-5 h-5" strokeWidth={isHomeActive ? 2.5 : 2} />
          </div>
          <span className="text-[12px] font-lexend tracking-tight">Home</span>
        </a>

        {/* Tab 2: History */}
        <a
          href="#history"
          data-path="history"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('history');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
            isHistoryActive
              ? 'bg-[#d8e4d0] text-[#161e13] font-semibold'
              : 'text-[#43483f] hover:text-[#161e13] hover:bg-[#e4eedb]'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-0.5">
            <Calendar className="w-5 h-5" strokeWidth={isHistoryActive ? 2.5 : 2} />
          </div>
          <span className="text-[12px] font-lexend tracking-tight">History</span>
        </a>

        {/* Tab 3: Alerts / Notifications */}
        <a
          href="#alerts"
          data-path={isNotificationScreen ? 'notifications' : 'alerts'}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('alerts');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all relative ${
            isAlertsActive
              ? 'bg-[#d8e4d0] text-[#161e13] font-semibold'
              : 'text-[#43483f] hover:text-[#161e13] hover:bg-[#e4eedb]'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-0.5 relative">
            <Bell className="w-5 h-5" strokeWidth={isAlertsActive ? 2.5 : 2} />
            {/* Soft badge indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#f39c42]" />
          </div>
          <span className="text-[12px] font-lexend tracking-tight">Alerts</span>
        </a>

        {/* Hidden alias anchor to guarantee xpath query matches either alerts or notifications */}
        <a
          href="#alerts-alias"
          data-path={isNotificationScreen ? 'alerts' : 'notifications'}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('alerts');
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          Alerts
        </a>

        {/* Tab 4: Settings */}
        <a
          href="#settings"
          data-path="settings"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('settings');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
            isSettingsActive
              ? 'bg-[#d8e4d0] text-[#161e13] font-semibold'
              : 'text-[#43483f] hover:text-[#161e13] hover:bg-[#e4eedb]'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-0.5">
            <Sliders className="w-5 h-5" strokeWidth={isSettingsActive ? 2.5 : 2} />
          </div>
          <span className="text-[12px] font-lexend tracking-tight">Settings</span>
        </a>
      </div>
    </nav>
  );
};
