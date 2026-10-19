import React from 'react';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { Screen } from '../types.ts';

interface MetricCardsProps {
  temperature: {
    status: string;
    value: string;
    subtext?: string;
    isWarning?: boolean;
    isCold?: boolean;
    isHot?: boolean;
  };
  humidity: {
    status: string;
    value: string;
    subtext?: string;
    isWarning?: boolean;
    isDry?: boolean;
    isHumid?: boolean;
  };
  pressure: {
    value: string;
    status: string;
    subtext?: string;
  };
  onNavigate: (screen: Screen) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  temperature,
  humidity,
  pressure,
  onNavigate,
}) => {
  return (
    <div className="w-full">
      <h3 className="font-lexend font-bold text-lg text-[#161e13] mb-3">
        How your plant is doing
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {/* Temperature Card */}
        <button
          onClick={() => onNavigate('temperature-history')}
          className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all text-center min-h-[128px] ${
            temperature.isWarning
              ? temperature.isCold
                ? 'bg-[#ebf6fa] border-[#9bcfdf] text-[#134d5b]'
                : 'bg-[#fff5ea] border-[#ffdcbc] text-[#683d00]'
              : 'bg-[#f4efe6]/60 border-[#dce5d4] text-[#161e13] hover:bg-[#edf7e5]'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-[#316573] mb-1">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] font-lexend font-semibold text-[#43483f]">
              Temperature
            </span>
            <span
              className={`block text-[13px] font-lexend font-bold mt-0.5 ${
                temperature.isWarning
                  ? temperature.isCold
                    ? 'text-[#1e6175]'
                    : 'text-[#9c5108]'
                  : 'text-[#161e13]'
              }`}
            >
              {temperature.status}
            </span>
            <span className="block text-xs font-mono font-medium text-[#161e13]">
              {temperature.value}
            </span>
            {temperature.subtext && (
              <span className="block text-[10px] text-[#5c6457] mt-0.5">
                {temperature.subtext}
              </span>
            )}
          </div>
        </button>

        {/* Humidity Card */}
        <button
          onClick={() => onNavigate('humidity-history')}
          className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all text-center min-h-[128px] ${
            humidity.isWarning
              ? 'bg-[#fff5ea] border-[#ffdcbc] text-[#683d00]'
              : 'bg-[#f4efe6]/60 border-[#dce5d4] text-[#161e13] hover:bg-[#edf7e5]'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-[#316573] mb-1">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] font-lexend font-semibold text-[#43483f]">
              Humidity
            </span>
            <span
              className={`block text-[13px] font-lexend font-bold mt-0.5 ${
                humidity.isWarning ? 'text-[#9c5108]' : 'text-[#161e13]'
              }`}
            >
              {humidity.status}
            </span>
            <span className="block text-xs font-mono font-medium text-[#161e13]">
              {humidity.value}
            </span>
            {humidity.subtext && (
              <span className="block text-[10px] text-[#5c6457] mt-0.5">
                {humidity.subtext}
              </span>
            )}
          </div>
        </button>

        {/* Pressure Card */}
        <button
          onClick={() => onNavigate('atmospheric-pressure')}
          className="flex flex-col items-center justify-between p-3 rounded-2xl border border-[#dce5d4] bg-[#f4efe6]/60 text-[#161e13] hover:bg-[#edf7e5] transition-all text-center min-h-[128px]"
        >
          <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-[#316573] mb-1">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[11px] font-lexend font-semibold text-[#43483f]">
              Pressure
            </span>
            <span className="block text-[13px] font-lexend font-bold text-[#161e13] mt-0.5">
              {pressure.value}
            </span>
            <span className="block text-xs font-mono font-medium text-[#43483f]">
              {pressure.status}
            </span>
            {pressure.subtext && (
              <span className="block text-[10px] text-[#5c6457] mt-0.5">
                {pressure.subtext}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
