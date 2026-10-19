import React, { useState } from 'react';
import { ShieldCheck, Info, X, Droplet, Thermometer, Database } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'notice' | 'details';
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  initialView = 'notice',
}) => {
  const [view, setView] = useState<'notice' | 'details'>(initialView);

  React.useEffect(() => {
    setView(initialView);
  }, [initialView, isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    try {
      localStorage.setItem('happyplant_privacy_ack', 'true');
    } catch {
    }
    onClose();
  };

  const handleOpenDetails = () => {
    setView('details');
  };

  const handleBackToNoticeOrClose = () => {
    if (initialView === 'details') {
      onClose();
    } else {
      setView('notice');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="max-w-md w-full bg-[#f3fceb] border border-[#dce5d4] rounded-3xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        {view === 'notice' ? (
          <div>
            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#dce7d4] text-[#203916] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            {/* Title */}
            <h2
              id="privacy-modal-title"
              className="font-lexend font-bold text-xl text-[#161e13] mb-3"
            >
              Your data, your plant
            </h2>

            {/* Exact notice body specified by prompt */}
            <p className="text-sm font-sans text-[#43483f] leading-relaxed mb-6">
              HappyPlant saves sensor readings, plant history and watering records so you can monitor your plant over time. This information is used to display your plant&apos;s conditions and history.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-12 bg-[#203916] hover:bg-[#2c4c20] text-white rounded-full font-lexend font-semibold text-sm flex items-center justify-center shadow-xs active:scale-[0.99] transition-all cursor-pointer"
              >
                Continue
              </button>

              <button
                type="button"
                onClick={handleOpenDetails}
                className="w-full py-2 text-center text-xs font-lexend font-semibold text-[#316573] hover:text-[#203916] transition-colors cursor-pointer"
              >
                Learn more about data
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Close / Back Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e8f1df] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#edf7e5] text-[#203916] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <h3
                  id="privacy-modal-title"
                  className="font-lexend font-bold text-base text-[#161e13]"
                >
                  About data in HappyPlant
                </h3>
              </div>
              <button
                type="button"
                onClick={handleBackToNoticeOrClose}
                className="w-8 h-8 rounded-full bg-[#e2ebd9] hover:bg-[#d8e4d0] text-[#161e13] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Detailed Content */}
            <div className="space-y-4 text-xs text-[#43483f] leading-relaxed">
              <div className="bg-white/80 border border-[#dce5d4] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-lexend font-bold text-[#161e13]">
                  <Thermometer className="w-4 h-4 text-[#316573]" />
                  <span>1. Sensor Readings</span>
                </div>
                <p>
                  Measurements including ambient temperature, relative humidity, and atmospheric pressure are recorded over time to construct your plant&apos;s daily and weekly environmental history charts.
                </p>
              </div>

              <div className="bg-white/80 border border-[#dce5d4] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-lexend font-bold text-[#161e13]">
                  <Droplet className="w-4 h-4 text-[#316573]" />
                  <span>2. Plant Profile &amp; Care Logs</span>
                </div>
                <p>
                  Your chosen plant species, nickname, watering timestamps, and soil hydration targets are preserved so HappyPlant can alert you when a watering is due or when room conditions exceed healthy thresholds.
                </p>
              </div>

              <div className="bg-white/80 border border-[#dce5d4] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 font-lexend font-bold text-[#161e13]">
                  <Info className="w-4 h-4 text-[#203916]" />
                  <span>3. Care Preferences</span>
                </div>
                <p>
                  Visual preferences (such as Celsius vs. Fahrenheit and quiet notification hours) are stored to keep your dashboard experience consistent across sessions.
                </p>
              </div>
            </div>

            {/* Bottom Dismiss Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-12 bg-[#203916] hover:bg-[#2c4c20] text-white rounded-full font-lexend font-semibold text-sm flex items-center justify-center shadow-xs active:scale-[0.99] transition-all cursor-pointer"
              >
                Close and return to app
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
