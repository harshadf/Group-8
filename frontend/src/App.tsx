import React, { useState, useEffect, useCallback } from 'react';
import { Screen, ActivePlant } from './types.ts';
import { TopBar } from './components/TopBar.tsx';
import { Navigation } from './components/Navigation.tsx';
import { DashboardScreen } from './screens/DashboardScreen.tsx';
import { HistoryScreen } from './screens/HistoryScreen.tsx';
import { TemperatureHistoryScreen } from './screens/TemperatureHistoryScreen.tsx';
import { HumidityHistoryScreen } from './screens/HumidityHistoryScreen.tsx';
import { AtmosphericPressureScreen } from './screens/AtmosphericPressureScreen.tsx';
import { AlertsScreen } from './screens/AlertsScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { AddPlantScreen } from './screens/AddPlantScreen.tsx';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal.tsx';
import { fetchActivePlantFromApi } from './api.ts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [privacyModalView, setPrivacyModalView] = useState<'notice' | 'details'>('notice');
  const [activePlant, setActivePlant] = useState<ActivePlant | undefined>(undefined);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const loadActivePlant = useCallback(async () => {
    const plant = await fetchActivePlantFromApi();
    if (plant) {
      setActivePlant(plant);
    } else {
      setActivePlant(undefined);
      setCurrentScreen((prev) => (prev === 'home' ? 'home-no-plant' : prev));
    }
  }, []);

  useEffect(() => {
    loadActivePlant();
  }, [loadActivePlant]);

  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem('happyplant_privacy_ack');
      if (!acknowledged) {
        setShowPrivacyModal(true);
        setPrivacyModalView('notice');
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Screen;
      const validScreens: Screen[] = [
        'home',
        'history',
        'settings',
        'alerts',
        'humidity-history',
        'temperature-history',
        'atmospheric-pressure',
        'home-no-plant',
        'home-unavailable',
        'add-plant',
        'dashboard-watering-due',
        'dashboard-temp-low',
        'dashboard-temp-high',
        'dashboard-humidity-low',
        'dashboard-humidity-high',
      ];
      if (validScreens.includes(hash)) {
        setCurrentScreen(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    window.location.hash = screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f3fceb] text-[#161e13] flex flex-col font-sans selection:bg-[#ccecba]">
      <TopBar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        isOnline={isOnline && currentScreen !== 'home-unavailable'}
      />

      <div className="flex-1 w-full">
        {(currentScreen === 'home' ||
          currentScreen === 'home-no-plant' ||
          currentScreen === 'home-unavailable' ||
          currentScreen === 'dashboard-watering-due' ||
          currentScreen === 'dashboard-temp-low' ||
          currentScreen === 'dashboard-temp-high' ||
          currentScreen === 'dashboard-humidity-low' ||
          currentScreen === 'dashboard-humidity-high') && (
          <DashboardScreen
            screen={currentScreen}
            onNavigate={handleNavigate}
            activePlant={activePlant}
            onOnlineStatusChange={setIsOnline}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen onNavigate={handleNavigate} activePlant={activePlant} />
        )}

        {currentScreen === 'temperature-history' && (
          <TemperatureHistoryScreen onNavigate={handleNavigate} activePlant={activePlant} />
        )}

        {currentScreen === 'humidity-history' && (
          <HumidityHistoryScreen onNavigate={handleNavigate} activePlant={activePlant} />
        )}

        {currentScreen === 'atmospheric-pressure' && (
          <AtmosphericPressureScreen onNavigate={handleNavigate} activePlant={activePlant} />
        )}

        {currentScreen === 'alerts' && (
          <AlertsScreen onNavigate={handleNavigate} activePlant={activePlant} />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            onNavigate={handleNavigate}
            activePlant={activePlant}
            onOpenDataInfo={() => {
              setPrivacyModalView('details');
              setShowPrivacyModal(true);
            }}
          />
        )}

        {currentScreen === 'add-plant' && (
          <AddPlantScreen
            onNavigate={handleNavigate}
            activePlant={activePlant}
            onPlantCreated={(newPlant) => {
              setActivePlant(newPlant);
              loadActivePlant();
            }}
          />
        )}
      </div>

      <Navigation currentScreen={currentScreen} onNavigate={handleNavigate} />

      <PrivacyNoticeModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        initialView={privacyModalView}
      />
    </div>
  );
}