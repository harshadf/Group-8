import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { fetchActivePlantFromApi, fetchStatusFromApi } from './api.ts';

function usePlantNotifications(activePlant?: ActivePlant) {
  const notifiedSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!activePlant) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const intervalId = setInterval(async () => {
      if (Notification.permission !== 'granted') return;

      try {
        const status = await fetchStatusFromApi();
        const plantName = activePlant.nickname || 'Your plant';

        if (status.wateringDue && !notifiedSet.current.has('water')) {
          new Notification('Watering due!', {
            body: `${plantName} needs a drink.`,
          });
          notifiedSet.current.add('water');
        } else if (!status.wateringDue) {
          notifiedSet.current.delete('water');
        }

        if (status.temperature !== null) {
          if (status.temperature < status.tempRange.min && !notifiedSet.current.has('temp-low')) {
            new Notification('Temperature too low', {
              body: `The room is at ${status.temperature.toFixed(1)}°C.`,
            });
            notifiedSet.current.add('temp-low');
          } else if (status.temperature > status.tempRange.max && !notifiedSet.current.has('temp-high')) {
            new Notification('Temperature too high', {
              body: `The room is at ${status.temperature.toFixed(1)}°C.`,
            });
            notifiedSet.current.add('temp-high');
          } else if (status.temperature >= status.tempRange.min && status.temperature <= status.tempRange.max) {
            notifiedSet.current.delete('temp-low');
            notifiedSet.current.delete('temp-high');
          }
        }

        if (status.humidity !== null) {
          if (status.humidity < status.humidityRange.min && !notifiedSet.current.has('hum-low')) {
            new Notification('Air is too dry', {
              body: `Humidity dropped to ${Math.round(status.humidity)}%.`,
            });
            notifiedSet.current.add('hum-low');
          } else if (status.humidity > status.humidityRange.max && !notifiedSet.current.has('hum-high')) {
            new Notification('Humidity is too high', {
              body: `Humidity reached ${Math.round(status.humidity)}%.`,
            });
            notifiedSet.current.add('hum-high');
          } else if (status.humidity >= status.humidityRange.min && status.humidity <= status.humidityRange.max) {
            notifiedSet.current.delete('hum-low');
            notifiedSet.current.delete('hum-high');
          }
        }
      } catch (error) {
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [activePlant]);
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [privacyModalView, setPrivacyModalView] = useState<'notice' | 'details'>('notice');
  const [activePlant, setActivePlant] = useState<ActivePlant | undefined>(undefined);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  usePlantNotifications(activePlant);

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
            onPlantDeleted={() => {
              void loadActivePlant();
            }}
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

