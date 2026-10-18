import React, { useState, useEffect } from 'react';
import { ArrowLeft, Thermometer, ShieldCheck } from 'lucide-react';
import { Screen, ActivePlant } from '../types.ts';
import { fetchReadingsFromApi, NormalizedReading } from '../api.ts';

interface TemperatureHistoryScreenProps {
  onNavigate: (screen: Screen) => void;
  activePlant?: ActivePlant;
}

export const TemperatureHistoryScreen: React.FC<TemperatureHistoryScreenProps> = ({
  onNavigate,
  activePlant,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [readings, setReadings] = useState<NormalizedReading[]>([]);

  useEffect(() => {
    fetchReadingsFromApi(timeRange).then(setReadings);
  }, [timeRange]);

  const validTemps = readings
    .filter((r) => r.temperature !== null)
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: r.temperature as number,
    }));

  const currentTemp = validTemps.length > 0 ? validTemps[validTemps.length - 1].temp : null;
  const minTemp = validTemps.length > 0 ? Math.min(...validTemps.map((d) => d.temp)) : null;
  const maxTemp = validTemps.length > 0 ? Math.max(...validTemps.map((d) => d.temp)) : null;
  const avgTemp =
    validTemps.length > 0
      ? validTemps.reduce((acc, d) => acc + d.temp, 0) / validTemps.length
      : null;

  const plantLabel = activePlant
    ? `${activePlant.nickname} · ${activePlant.speciesName || activePlant.plantType}`
    : 'Monitored Plant';

  return (
    <main className="max-w-md mx-auto px-4 pt-3 pb-24">
      <div className="mb-3">
        <a
          href="#history"
          aria-label="Back to History"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('history');
          }}
          className="inline-flex items-center gap-2 text-xs font-lexend font-medium text-[#203916] hover:text-[#2c4c20] bg-[#e2ebd9] hover:bg-[#d8e4d0] px-3 py-1.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to History</span>
        </a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-lexend font-bold text-2xl text-[#161e13]">Temperature History</h1>
          <p className="text-xs text-[#43483f]">{plantLabel}</p>
        </div>
        <div className="flex items-center p-1 bg-[#e2ebd9] rounded-xl text-xs font-lexend">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              timeRange === '24h'
                ? 'bg-white text-[#203916] font-semibold shadow-xs'
                : 'text-[#43483f]'
            }`}
          >
            24H
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${
              timeRange === '7d'
                ? 'bg-white text-[#203916] font-semibold shadow-xs'
                : 'text-[#43483f]'
            }`}
          >
            7D
          </button>
        </div>
      </div>

      <div className="bg-white/90 border border-[#dce5d4] rounded-3xl p-5 mb-5 shadow-xs">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-lexend font-medium text-[#43483f]">Current Room Temp</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-lexend font-bold text-[#161e13]">
                {currentTemp !== null ? `${currentTemp.toFixed(1)}°C` : '--'}
              </span>
              <span className="text-xs font-lexend text-[#203916] bg-[#ccecba] px-2 py-0.5 rounded-full font-semibold">
                {currentTemp !== null && (currentTemp < 18 || currentTemp > 24)
                  ? 'Outside Band'
                  : 'In Safe Band'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#ebf6fa] text-[#316573] flex items-center justify-center">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#edf7e5] rounded-xl p-3 flex items-center justify-between text-xs mb-4">
          <span className="text-[#43483f] font-lexend">Target Band</span>
          <span className="font-lexend font-bold text-[#203916]">18°C – 24°C</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#e8f1df] text-center">
          <div>
            <span className="block text-[10px] text-[#5c6457]">Min</span>
            <span className="font-lexend font-bold text-xs text-[#161e13]">
              {minTemp !== null ? `${minTemp.toFixed(1)}°C` : '--'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#5c6457]">Avg</span>
            <span className="font-lexend font-bold text-xs text-[#161e13]">
              {avgTemp !== null ? `${avgTemp.toFixed(1)}°C` : '--'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#5c6457]">Max</span>
            <span className="font-lexend font-bold text-xs text-[#161e13]">
              {maxTemp !== null ? `${maxTemp.toFixed(1)}°C` : '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#f4efe6]/70 border border-[#dce5d4] rounded-2xl p-4 mb-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#edf7e5] text-[#203916] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-lexend font-bold text-xs text-[#161e13] mb-0.5">
            Live sensor history
          </h4>
          <p className="text-[11px] text-[#43483f] leading-relaxed">
            Showing {validTemps.length} temperature readings retrieved from the backend.
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-lexend font-bold text-sm text-[#161e13] mb-2.5">
          Recent Readings Log
        </h3>
        <div className="bg-white/60 border border-[#dce5d4] rounded-2xl overflow-hidden divide-y divide-[#e8f1df]">
          {validTemps.length === 0 ? (
            <div className="p-4 text-xs text-[#5c6457]">No readings available from server.</div>
          ) : (
            validTemps.slice(-8).reverse().map((item, idx) => (
              <div
                key={idx}
                className="px-4 py-2.5 flex items-center justify-between text-xs font-lexend"
              >
                <span className="text-[#5c6457]">{item.time}</span>
                <span className="font-bold text-[#161e13] font-mono">
                  {item.temp.toFixed(1)}°C
                </span>
                <span className="text-[11px] text-[#203916] bg-[#edf7e5] px-2 py-0.5 rounded-full">
                  {item.temp < 18 ? 'Low' : item.temp > 24 ? 'High' : 'Normal'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};