import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Gauge, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { Screen, ActivePlant } from '../types.ts';
import {
  fetchReadingsFromApi,
  fetchWateringEventsFromApi,
  NormalizedReading,
  WateringEventRecord,
  formatRelativeTime,
} from '../api.ts';

interface HistoryScreenProps {
  onNavigate: (screen: Screen) => void;
  activePlant?: ActivePlant;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigate, activePlant }) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [readings, setReadings] = useState<NormalizedReading[]>([]);
  const [waterings, setWaterings] = useState<WateringEventRecord[]>([]);

  useEffect(() => {
    fetchReadingsFromApi(timeRange).then(setReadings);
    fetchWateringEventsFromApi().then(setWaterings);
  }, [timeRange]);

  const latest = readings.length > 0 ? readings[readings.length - 1] : null;
  const recentSlice = readings.slice(-12);

  const plantLabel = activePlant
    ? `${activePlant.nickname} · ${activePlant.speciesName || activePlant.plantType}`
    : 'Monitored Plant';

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-lexend font-bold text-2xl text-[#161e13]">History</h1>
          <p className="text-xs text-[#43483f]">{plantLabel}</p>
        </div>
        <div className="flex items-center p-1 bg-[#e2ebd9] rounded-xl text-xs font-lexend">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-white text-[#203916] font-semibold shadow-xs'
                  : 'text-[#43483f] hover:text-[#161e13]'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <a
          href="#temp-history"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('temperature-history');
          }}
          className="block p-4 rounded-2xl bg-white/80 hover:bg-white border border-[#dce5d4] transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ebf6fa] text-[#316573] flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="font-lexend font-bold text-sm text-[#161e13] block">
                  Temperature History
                </span>
                <span className="text-[11px] text-[#5c6457]">Optimal 18°C – 24°C</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-lexend font-bold text-base text-[#161e13]">
                {latest?.temperature !== null && latest?.temperature !== undefined
                  ? `${latest.temperature.toFixed(1)}°C`
                  : '--'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#43483f] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="h-6 w-full flex items-end gap-1 px-1 pt-1 opacity-80">
            {(recentSlice.length > 0
              ? recentSlice.map((r) => Math.min(100, Math.max(15, ((r.temperature ?? 20) / 35) * 100)))
              : [40, 45, 50, 48, 52, 55, 53, 50, 52, 54, 52, 51]
            ).map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${val}%` }}
                className="flex-1 bg-[#9bcfdf] rounded-t-sm"
              />
            ))}
          </div>
        </a>

        <a
          href="#humidity-history"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('humidity-history');
          }}
          className="block p-4 rounded-2xl bg-white/80 hover:bg-white border border-[#dce5d4] transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#edf7e5] text-[#203916] flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="font-lexend font-bold text-sm text-[#161e13] block">
                  Humidity History
                </span>
                <span className="text-[11px] text-[#5c6457]">Healthy 50% – 60%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-lexend font-bold text-base text-[#161e13]">
                {latest?.humidity !== null && latest?.humidity !== undefined
                  ? `${Math.round(latest.humidity)}%`
                  : '--'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#43483f] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="h-6 w-full flex items-end gap-1 px-1 pt-1 opacity-80">
            {(recentSlice.length > 0
              ? recentSlice.map((r) => Math.min(100, Math.max(15, r.humidity ?? 50)))
              : [50, 52, 55, 58, 54, 52, 51, 53, 54, 56, 53, 52]
            ).map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${val}%` }}
                className="flex-1 bg-[#86ab6a] rounded-t-sm"
              />
            ))}
          </div>
        </a>

        <a
          href="#pressure-history"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('atmospheric-pressure');
          }}
          className="block p-4 rounded-2xl bg-white/80 hover:bg-white border border-[#dce5d4] transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#fff5ea] text-[#e89a3c] flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <span className="font-lexend font-bold text-sm text-[#161e13] block">
                  Atmospheric pressure History
                </span>
                <span className="text-[11px] text-[#5c6457]">Barometric stability</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-lexend font-bold text-base text-[#161e13]">
                {latest?.pressure !== null && latest?.pressure !== undefined
                  ? `${Math.round(latest.pressure)} hPa`
                  : '--'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#43483f] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="h-6 w-full flex items-end gap-1 px-1 pt-1 opacity-80">
            {(recentSlice.length > 0
              ? recentSlice.map((r) =>
                  Math.min(100, Math.max(20, (((r.pressure ?? 1013) - 980) / 60) * 100))
                )
              : [60, 60, 62, 61, 62, 63, 62, 62, 61, 62, 62, 62]
            ).map((val, idx) => (
              <div
                key={idx}
                style={{ height: `${val}%` }}
                className="flex-1 bg-[#e89a3c] rounded-t-sm"
              />
            ))}
          </div>
        </a>
      </div>

      <div>
        <h3 className="font-lexend font-bold text-base text-[#161e13] mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#203916]" />
          <span>Care Timeline</span>
        </h3>
        <div className="bg-white/60 border border-[#dce5d4] rounded-2xl p-4 space-y-3">
          {waterings.length === 0 ? (
            <p className="text-xs text-[#5c6457]">No watering events recorded yet.</p>
          ) : (
            waterings.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-b-0 border-[#e8f1df]"
              >
                <div className="w-7 h-7 rounded-full bg-[#edf7e5] text-[#203916] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-lexend font-semibold text-xs text-[#161e13]">
                      Watered {activePlant?.nickname || 'plant'}
                    </span>
                    <span className="text-[10px] text-[#5c6457]">
                      {formatRelativeTime(event.watered_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#43483f] mt-0.5">
                    {event.notes || 'Watering event recorded.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};