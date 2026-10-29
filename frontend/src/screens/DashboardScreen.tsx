import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  RotateCw,
  Droplet,
  Info,
  Wind,
  WifiOff,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Screen, ActivePlant } from '../types.ts';
import { PlantCharacter, PlantMood } from '../components/PlantCharacter.tsx';
import { MetricCards } from '../components/MetricCards.tsx';
import {
  fetchStatusFromApi,
  recordWateringToApi,
  fetchReadingsFromApi,
  NormalizedStatus,
  formatRelativeTime,
} from '../api.ts';

interface DashboardScreenProps {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  activePlant?: ActivePlant;
  onOnlineStatusChange?: (online: boolean) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  screen,
  onNavigate,
  activePlant,
  onOnlineStatusChange,
}) => {
  const [wateredToast, setWateredToast] = useState(false);
  const [isRecordingWater, setIsRecordingWater] = useState(false);
  const [statusData, setStatusData] = useState<NormalizedStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pressureTrend, setPressureTrend] = useState('Stable');

  const [showWateringModal, setShowWateringModal] = useState(false);
  const [wateringNote, setWateringNote] = useState('');

  const loadDashboardData = useCallback(async () => {
    try {
      const data = await fetchStatusFromApi();
      setStatusData(data);

      if (onOnlineStatusChange) {
        onOnlineStatusChange(data.isOnline);
      }

      if (data.isOnline) {
        const readings = await fetchReadingsFromApi('24h', activePlant?.id);
        const validPress = readings.filter((r) => r.pressure !== null);

        if (validPress.length >= 2) {
          const currentP = validPress[validPress.length - 1].pressure as number;
          const prevP = validPress[validPress.length - 2].pressure as number;
          const diff = currentP - prevP;

          if (diff >= 1) {
            setPressureTrend('Rising');
          } else if (diff <= -1) {
            setPressureTrend('Falling');
          } else {
            setPressureTrend('Stable');
          }
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [onOnlineStatusChange, activePlant?.id]);

  useEffect(() => {
    setStatusData(null);
    setLoading(true);
    setPressureTrend('Stable');
  }, [activePlant?.id]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const pollDashboard = async () => {
      await loadDashboardData();

      if (isMounted) {
        timeoutId = setTimeout(pollDashboard, 5000);
      }
    };

    pollDashboard();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [loadDashboardData, activePlant]);

  const handleOpenWateringModal = () => {
    setWateringNote('');
    setShowWateringModal(true);
  };

  const confirmRecordWatering = async () => {
    setShowWateringModal(false);
    setIsRecordingWater(true);

    const ok = await recordWateringToApi(wateringNote).catch(() => false);

    setIsRecordingWater(false);
    if (ok) {
      setWateredToast(true);
      await loadDashboardData();
      setTimeout(() => {
        setWateredToast(false);
      }, 3500);
    }
  };

  if (screen === 'home-no-plant' || (!loading && !activePlant)) {
    return (
      <main className="max-w-md mx-auto px-4 pt-4 pb-24 flex flex-col items-center">
        <div className="my-4">
          <PlantCharacter mood="sleeping" className="w-40 h-40" />
        </div>
        <h1 className="font-lexend font-bold text-2xl text-center text-[#161e13] mt-2 mb-2">
          No plant monitored yet
        </h1>
        <p className="text-sm font-sans text-center text-[#43483f] max-w-xs mb-6 leading-relaxed">
          HappyPlant is ready to track your plant&apos;s moisture, temperature, and environment.
        </p>
        <a
          href="#add-plant"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('add-plant');
          }}
          className="w-full h-14 bg-[#203916] hover:bg-[#2c4c20] text-white rounded-full font-lexend font-semibold flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] transition-all mb-8"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Start monitoring a plant</span>
        </a>
        <div className="w-full bg-[#f4efe6]/60 border border-[#dce5d4] rounded-3xl p-5 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#e2ebd9] flex items-center justify-center text-[#203916] shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-lexend font-bold text-sm text-[#161e13] mb-1">
              Quick Setup
            </h4>
            <p className="text-xs text-[#43483f] leading-relaxed">
              Select an existing plant or add a new plant in Settings to start receiving live readings from your sensor.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const plantName = activePlant?.nickname || 'Monitored Plant';
  const speciesName = activePlant?.speciesName || activePlant?.plantType || '';

  const isUnavailable =
    screen === 'home-unavailable' || (statusData !== null && !statusData.isOnline);

  if (isUnavailable) {
    return (
      <main className="max-w-md mx-auto px-4 pt-3 pb-24 flex flex-col items-center">
        <div className="text-center mb-1">
          <h2 className="font-lexend font-bold text-2xl text-[#161e13]">{plantName}</h2>
          <span className="text-xs text-[#43483f]">{speciesName}</span>
        </div>
        <div className="my-3">
          <PlantCharacter mood="unavailable" className="w-40 h-40" />
        </div>
        <h1 className="font-lexend font-bold text-xl text-center text-[#161e13] mb-2">
          Sensor readings unavailable
        </h1>
        <p className="text-xs text-center text-[#43483f] max-w-xs mb-4 leading-relaxed">
          We couldn&apos;t get recent environmental readings from your sensor. Check that your HappyPlant sensor is connected.
        </p>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#e2ebd9] text-[#43483f] rounded-full text-xs font-lexend mb-4">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Sensor offline · {plantName} Monitor</span>
        </div>
        <button
          id="checkConnectionBtn"
          onClick={() => {
            loadDashboardData();
            onNavigate('home');
          }}
          className="w-full h-13 bg-[#edf7e5] hover:bg-[#e2ebd9] border border-[#c4c8bc] text-[#161e13] rounded-full font-lexend font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all mb-3 cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 text-[#203916] ${loading ? 'animate-spin' : ''}`} />
          <span>Check sensor connection</span>
        </button>
        <span className="text-[11px] text-[#5c6457] mb-6">
          Last synced: {formatRelativeTime(statusData?.lastSyncedAt)}
        </span>
        <MetricCards
          temperature={{ status: 'Unavailable', value: '--', isWarning: false }}
          humidity={{ status: 'Unavailable', value: '--', isWarning: false }}
          pressure={{ status: 'Unavailable', value: '--' }}
          onNavigate={onNavigate}
        />
      </main>
    );
  }

  const mood: PlantMood = statusData?.mood || 'healthy';
  const tempMin = statusData?.tempRange.min ?? 18;
  const tempMax = statusData?.tempRange.max ?? 24;
  const humMin = statusData?.humidityRange.min ?? 50;
  const humMax = statusData?.humidityRange.max ?? 60;

  const isCold =
    statusData?.temperature !== null &&
    statusData?.temperature !== undefined &&
    statusData.temperature < tempMin;

  const isHot =
    statusData?.temperature !== null &&
    statusData?.temperature !== undefined &&
    statusData.temperature > tempMax;

  const isDry =
    statusData?.humidity !== null &&
    statusData?.humidity !== undefined &&
    statusData.humidity < humMin;

  const isHumid =
    statusData?.humidity !== null &&
    statusData?.humidity !== undefined &&
    statusData.humidity > humMax;

  const isWateringDue = Boolean(statusData?.wateringDue);

  const careNotes: { title: string; text: string }[] = [];

  if (isCold) {
    careNotes.push({
      title: 'Gentle care note',
      text: 'Keep away from drafty windows or cold airflow to maintain warmth.',
    });
  } else if (isHot) {
    careNotes.push({
      title: 'Care Suggestion',
      text: 'Consider increasing room ventilation or moving out of direct sun.',
    });
  }

  if (isDry) {
    careNotes.push({
      title: 'Air moisture note',
      text: 'Room air is dry. A gentle room humidifier or misting nearby can help.',
    });
  } else if (isHumid) {
    careNotes.push({
      title: 'Care Suggestion',
      text: 'Stagnant moist air can encourage mold. Consider opening a window for gentle airflow.',
    });
  }

  const totalIssues =
    (isWateringDue ? 1 : 0) + (isCold || isHot ? 1 : 0) + (isDry || isHumid ? 1 : 0);

  let title = `${plantName} is thriving`;
  let subtitle = 'All environmental readings are in the sweet spot.';

  if (totalIssues > 1) {
    title = 'Multiple care alerts detected';
    subtitle = 'Several environmental conditions require your attention.';
  } else if (isWateringDue) {
    title = 'Your plant needs water';
    subtitle = 'Soil moisture is low and ready for a drink.';
  } else if (isCold) {
    title = 'The room feels too cold';
    subtitle = `Current temperature is below the recommended ${tempMin}°C band.`;
  } else if (isHot) {
    title = 'The room is too warm';
    subtitle = `Current temperature is above the comfortable ${tempMax}°C band.`;
  } else if (isDry) {
    title = 'Air humidity is too dry';
    subtitle = `Ambient moisture is below the healthy ${humMin}% range.`;
  } else if (isHumid) {
    title = 'Air humidity is very high';
    subtitle = `Ambient moisture is above the comfortable ${humMax}% range.`;
  }

  const tempVal =
    statusData?.temperature !== null && statusData?.temperature !== undefined
      ? `${statusData.temperature.toFixed(1)}°C`
      : '--';
  const humVal =
    statusData?.humidity !== null && statusData?.humidity !== undefined
      ? `${Math.round(statusData.humidity)}%`
      : '--';
  const pressVal =
    statusData?.pressure !== null && statusData?.pressure !== undefined
      ? `${Math.round(statusData.pressure)} hPa`
      : '--';

  const tempProps = {
    status: statusData?.tempStatus || 'Looks good',
    value: tempVal,
    subtext: `(${tempMin}°C - ${tempMax}°C)`,
    isWarning: isCold || isHot,
    isCold,
    isHot,
  };

  const humidityProps = {
    status: statusData?.humidityStatus || 'Looks good',
    value: humVal,
    subtext: `(${humMin}% - ${humMax}%)`,
    isWarning: isDry || isHumid,
    isDry,
    isHumid,
  };

  const pressureProps = {
    value: pressVal,
    status: statusData?.pressure === null || statusData?.pressure === undefined ? 'Unavailable' : pressureTrend,
  };

  const lastWateredText = statusData?.lastWateredAt
    ? `Last watered ${formatRelativeTime(statusData.lastWateredAt)}`
    : 'No recent watering recorded';

  return (
    <main className="max-w-md mx-auto px-4 pt-3 pb-24 flex flex-col items-center">
      <div className="text-center mb-1">
        <h2 className="font-lexend font-bold text-2xl text-[#161e13]">{plantName}</h2>
        <span className="text-xs text-[#43483f]">{speciesName}</span>
      </div>

      <div className="my-2">
        <PlantCharacter mood={mood} className="w-40 h-40" />
      </div>

      <h1 className="font-lexend font-bold text-xl text-center text-[#161e13] mb-1.5">
        {title}
      </h1>
      <p className="text-xs text-center text-[#43483f] max-w-xs mb-3 leading-relaxed">
        {subtitle}
      </p>

      <button
        onClick={handleOpenWateringModal}
        disabled={isRecordingWater}
        className="w-full h-13 bg-[#203916] hover:bg-[#2e4f20] text-white rounded-full font-lexend font-semibold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all mb-3 cursor-pointer disabled:opacity-60"
      >
        {isRecordingWater ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Droplet className="w-4 h-4 fill-white" />
        )}
        <span>Record a watering</span>
      </button>

      {wateredToast && (
        <div className="w-full bg-[#ccecba] text-[#082103] p-3 rounded-2xl flex items-center gap-2 mb-3 text-xs font-lexend font-semibold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-[#203916]" />
          <span>Watering recorded to server!</span>
        </div>
      )}

      {careNotes.map((note, index) => (
        <div
          key={index}
          className="w-full bg-[#f4efe6]/80 border border-[#dce5d4] rounded-2xl p-3.5 mb-3.5 flex items-start gap-2.5"
        >
          <div className="w-7 h-7 rounded-full bg-[#e2ebd9] flex items-center justify-center text-[#203916] shrink-0 mt-0.5">
            <Wind className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-lexend font-bold text-xs text-[#161e13] mb-0.5">
              {note.title}
            </h4>
            <p className="text-[11px] text-[#43483f] leading-relaxed">{note.text}</p>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-1.5 text-[11px] text-[#5c6457] mb-5">
        <Droplet className="w-3 h-3 text-[#316573]" />
        <span>
          {statusData?.wateringDue ? 'Watering needed today · ' : 'Hydration OK · '}
          {lastWateredText}
        </span>
      </div>

      <MetricCards
        temperature={tempProps}
        humidity={humidityProps}
        pressure={pressureProps}
        onNavigate={onNavigate}
      />

      {showWateringModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-[#f3fceb] border border-[#dce5d4] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-lexend font-bold text-lg text-[#161e13]">
              Record Watering
            </h3>
            <p className="text-xs text-[#43483f]">
              Add a short note about the plant's condition (optional).
            </p>
            <textarea
              value={wateringNote}
              onChange={(e) => setWateringNote(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="e.g. Added liquid fertilizer, soil was very dry..."
              className="w-full p-3 rounded-xl bg-white border border-[#c4c8bc] font-sans text-sm text-[#161e13] focus:outline-none focus:ring-2 focus:ring-[#203916] resize-none"
            />
            <div className="text-right text-[10px] text-[#5c6457]">
              {wateringNote.length}/200
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={confirmRecordWatering}
                disabled={isRecordingWater}
                className="w-full h-12 bg-[#203916] hover:bg-[#2e4f20] text-white rounded-full font-lexend font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                Save Watering
              </button>
              <button
                onClick={() => setShowWateringModal(false)}
                disabled={isRecordingWater}
                className="w-full h-10 bg-transparent hover:bg-[#e2ebd9] text-[#161e13] rounded-full font-lexend font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};