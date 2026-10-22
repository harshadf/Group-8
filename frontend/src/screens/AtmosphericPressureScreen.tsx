import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gauge, Compass } from 'lucide-react';
import { Screen, ActivePlant } from '../types.ts';
import { fetchReadingsFromApi, NormalizedReading } from '../api.ts';

interface AtmosphericPressureScreenProps {
  onNavigate: (screen: Screen) => void;
  activePlant?: ActivePlant;
}

export const AtmosphericPressureScreen: React.FC<AtmosphericPressureScreenProps> = ({
  onNavigate,
  activePlant,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [readings, setReadings] = useState<NormalizedReading[]>([]);

  useEffect(() => {
    fetchReadingsFromApi(timeRange).then(setReadings);
  }, [timeRange]);

  const validPress = readings
    .filter((r) => r.pressure !== null)
    .map((r) => {
      const date = new Date(r.timestamp);

      return {
        time:
          timeRange === '30d'
            ? date.toLocaleDateString([], {
              day: '2-digit',
              month: '2-digit',
            })
            : date.toLocaleString([], {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
        pressure: r.pressure as number,
      };
    });




  const currentPress = validPress.length > 0 ? validPress[validPress.length - 1].pressure : null;
  const minPress = validPress.length > 0 ? Math.min(...validPress.map((d) => d.pressure)) : null;
  const maxPress = validPress.length > 0 ? Math.max(...validPress.map((d) => d.pressure)) : null;

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
          <h1 className="font-lexend font-bold text-2xl text-[#161e13]">
            Atmospheric Pressure
          </h1>
          <p className="text-xs text-[#43483f]">{plantLabel}</p>
        </div>
        <div className="flex items-center p-1 bg-[#e2ebd9] rounded-xl text-xs font-lexend">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${timeRange === '24h'
              ? 'bg-white text-[#203916] font-semibold shadow-xs'
              : 'text-[#43483f]'
              }`}
          >
            24H
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${timeRange === '7d'
              ? 'bg-white text-[#203916] font-semibold shadow-xs'
              : 'text-[#43483f]'
              }`}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-2.5 py-1 rounded-lg cursor-pointer ${timeRange === '30d'
              ? 'bg-white text-[#203916] font-semibold shadow-xs'
              : 'text-[#43483f]'
              }`}
          >
            30D
          </button>
        </div>
      </div>

      <div className="bg-white/90 border border-[#dce5d4] rounded-3xl p-5 mb-5 shadow-xs">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-lexend font-medium text-[#43483f]">
              Barometric Reading
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-lexend font-bold text-[#161e13]">
                {currentPress !== null ? `${Math.round(currentPress)} hPa` : '--'}
              </span>
              <span className="text-xs font-lexend text-[#683d00] bg-[#ffdcbc] px-2 py-0.5 rounded-full font-semibold">
                Stable
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#fff5ea] text-[#e89a3c] flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#edf7e5] rounded-xl p-3 flex items-center justify-between text-xs mb-4">
          <span className="text-[#43483f] font-lexend">Standard Sea-Level Baseline</span>
          <span className="font-lexend font-bold text-[#203916]">1013.25 hPa</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#e8f1df] text-center">
          <div>
            <span className="block text-[10px] text-[#5c6457]">Min</span>
            <span className="font-lexend font-bold text-xs text-[#161e13]">
              {minPress !== null ? `${Math.round(minPress)} hPa` : '--'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-[#5c6457]">Baro Trend</span>
            <span className="font-lexend font-bold text-xs text-[#161e13]">Steady</span>
          </div>
          <div>
            <span className="block text-[10px] text-[#5c6457]">Max</span>
            <span className="font-lexend font-bold text-xs text-[#161e13]">
              {maxPress !== null ? `${Math.round(maxPress)} hPa` : '--'}
            </span>
          </div>
        </div>
      </div>

    

      <div>
        <h3 className="font-lexend font-bold text-sm text-[#161e13] mb-2.5">Pressure Log</h3>
        <div className="bg-white/60 border border-[#dce5d4] rounded-2xl overflow-hidden divide-y divide-[#e8f1df]">
          {validPress.length === 0 ? (
            <div className="p-4 text-xs text-[#5c6457]">No readings available from server.</div>
          ) : (
            [...validPress].reverse().map((item, idx) => (<div
              key={idx}
              className="px-4 py-2.5 flex items-center justify-between text-xs font-lexend"
            >
              <span className="text-[#5c6457]">{item.time}</span>
              <span className="font-bold text-[#161e13] font-mono">
                {Math.round(item.pressure)} hPa
              </span>
              <span className="text-[11px] text-[#203916] bg-[#edf7e5] px-2 py-0.5 rounded-full">
                Stable
              </span>
            </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};