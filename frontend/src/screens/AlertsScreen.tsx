import React, { useState, useEffect } from 'react';
import { Droplet, Thermometer, Wind, CheckCircle2, ChevronRight } from 'lucide-react';
import { Screen, ActivePlant } from '../types.ts';
import { fetchStatusFromApi, formatRelativeTime } from '../api.ts';

interface AlertsScreenProps {
  onNavigate: (screen: Screen) => void;
  activePlant?: ActivePlant;
}

interface DynamicAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  targetScreen: Screen;
  type: 'water' | 'temp' | 'humidity' | 'sensor';
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ onNavigate, activePlant }) => {
  const [alerts, setAlerts] = useState<DynamicAlert[]>([]);
  const plantName = activePlant?.nickname || 'Your plant';

  useEffect(() => {
    fetchStatusFromApi().then((status) => {
      const list: DynamicAlert[] = [];
      const timeLabel = formatRelativeTime(status.lastSyncedAt);

      if (!status.isOnline) {
        list.push({
          id: 'offline',
          title: 'Sensor readings unavailable',
          message: `Cannot reach sensor for ${plantName}.`,
          time: timeLabel,
          targetScreen: 'home-unavailable',
          type: 'sensor',
        });
      }
      if (status.wateringDue) {
        list.push({
          id: 'water',
          title: 'Watering due today',
          message: `${plantName} needs a drink based on recent watering records.`,
          time: timeLabel,
          targetScreen: 'home',
          type: 'water',
        });
      }
      if (status.temperature !== null && status.temperature < status.tempRange.min) {
        list.push({
          id: 'temp-low',
          title: 'Temperature dip detected',
          message: `Room is at ${status.temperature.toFixed(1)}°C (below ${status.tempRange.min}°C).`,
          time: timeLabel,
          targetScreen: 'temperature-history',
          type: 'temp',
        });
      } else if (status.temperature !== null && status.temperature > status.tempRange.max) {
        list.push({
          id: 'temp-high',
          title: 'High temperature alert',
          message: `Room is at ${status.temperature.toFixed(1)}°C (above ${status.tempRange.max}°C).`,
          time: timeLabel,
          targetScreen: 'temperature-history',
          type: 'temp',
        });
      }
      if (status.humidity !== null && status.humidity < status.humidityRange.min) {
        list.push({
          id: 'hum-low',
          title: 'Dry air alert',
          message: `Relative humidity is at ${Math.round(status.humidity)}% (below ${status.humidityRange.min}%).`,
          time: timeLabel,
          targetScreen: 'humidity-history',
          type: 'humidity',
        });
      } else if (status.humidity !== null && status.humidity > status.humidityRange.max) {
        list.push({
          id: 'hum-high',
          title: 'High humidity alert',
          message: `Relative humidity is at ${Math.round(status.humidity)}% (above ${status.humidityRange.max}%).`,
          time: timeLabel,
          targetScreen: 'humidity-history',
          type: 'humidity',
        });
      }

      setAlerts(list);
    });
  }, [plantName]);

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-24">
      <div className="mb-4">
        <h1 className="font-lexend font-bold text-2xl text-[#161e13]">Alerts</h1>
        <p className="text-xs text-[#43483f]">Live plant care notifications for {plantName}</p>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white/50 border border-[#dce5d4] rounded-3xl p-6">
            <CheckCircle2 className="w-10 h-10 text-[#83bd75] mx-auto mb-2" />
            <h4 className="font-lexend font-bold text-sm text-[#161e13]">No active alerts</h4>
            <p className="text-xs text-[#43483f] mt-1">
              {plantName} is happy and all sensor readings are within target bands.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onNavigate(alert.targetScreen)}
              className="p-4 rounded-2xl border bg-white border-[#dce5d4] hover:border-[#203916] transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    alert.type === 'water'
                      ? 'bg-[#ffdcbc] text-[#683d00]'
                      : alert.type === 'temp'
                      ? 'bg-[#b6ebfb] text-[#134d5b]'
                      : alert.type === 'humidity'
                      ? 'bg-[#ffdcbc] text-[#683d00]'
                      : 'bg-[#edf7e5] text-[#203916]'
                  }`}
                >
                  {alert.type === 'water' && <Droplet className="w-4 h-4 fill-current" />}
                  {alert.type === 'temp' && <Thermometer className="w-4 h-4" />}
                  {alert.type === 'humidity' && <Wind className="w-4 h-4" />}
                  {alert.type === 'sensor' && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-lexend font-bold text-sm text-[#161e13] truncate">
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-[#5c6457] shrink-0 ml-2">{alert.time}</span>
                  </div>
                  <p className="text-xs text-[#43483f] leading-relaxed mb-2">{alert.message}</p>
                  <div className="flex items-center justify-between text-[11px] font-lexend font-semibold text-[#203916]">
                    <span>View details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};