import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Leaf,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Screen, PlantRecord, PlantTypeOption, ActivePlant } from '../types.ts';

interface AddPlantScreenProps {
  onNavigate: (screen: Screen) => void;
  activePlant?: ActivePlant;
  onPlantCreated?: (plant: ActivePlant) => void;
}

function formatMonitoringDates(startedAt: string, endedAt: string | null): string {
  try {
    const start = new Date(startedAt);
    const startStr = start.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (!endedAt) {
      return `Started ${startStr} · Currently Active`;
    }

    const end = new Date(endedAt);
    const endStr = end.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `Monitored ${startStr} – ${endStr}`;
  } catch {
    return 'Previous monitoring record';
  }
}

export const AddPlantScreen: React.FC<AddPlantScreenProps> = ({
  onNavigate,
  activePlant,
  onPlantCreated,
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [prefilledNote, setPrefilledNote] = useState<string | null>(null);

  const [plantTypes, setPlantTypes] = useState<PlantTypeOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [plantRecords, setPlantRecords] = useState<PlantRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const fetchPlantTypes = useCallback(async () => {
    try {
      setLoadingTypes(true);
      setTypesError(null);

      const res = await fetch('/api/plant-types');

      if (!res.ok) {
        throw new Error(`Failed to load plant types (HTTP ${res.status})`);
      }

      const data = await res.json();

      const rawTypes = Array.isArray(data?.plant_types)
        ? data.plant_types
        : Array.isArray(data)
          ? data
          : [];

      const types: PlantTypeOption[] = rawTypes.map((t: any) => ({
        id: t.id || t.name,
        name: t.name || t.id,
      }));

      if (types.length === 0) {
        throw new Error('No plant types returned by the backend.');
      }

      setPlantTypes(types);

      setSelectedType((prev) => {
        const match = types.some((t) => t.id === prev);
        return match ? prev : types[0].id;
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to retrieve plant types from server.';

      setTypesError(msg);
      setPlantTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  const fetchPlants = useCallback(async () => {
    try {
      setLoadingRecords(true);
      setRecordsError(null);

      const res = await fetch('/api/plants');

      if (!res.ok) {
        throw new Error(
          `Failed to retrieve plant records (HTTP ${res.status})`
        );
      }

      const data = await res.json();

      const records: PlantRecord[] = Array.isArray(data?.plants)
        ? data.plants
        : Array.isArray(data)
          ? data
          : [];

      setPlantRecords(records);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to retrieve saved plant records.';

      setRecordsError(msg);
      setPlantRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchPlantTypes();
    fetchPlants();
  }, [fetchPlantTypes, fetchPlants]);

  const getSpeciesName = (typeId: string): string => {
    return plantTypes.find((p) => p.id === typeId)?.name || typeId;
  };

  const handleSelectHistoricalPlant = (record: PlantRecord) => {
    if (record.plant_type) {
      setSelectedType(record.plant_type);
    }

    if (record.nickname && record.nickname.trim()) {
      setNickname(record.nickname.trim());

      setPrefilledNote(
        `Prefilled plant type "${getSpeciesName(record.plant_type)}" and nickname "${record.nickname.trim()}". Starting monitoring creates a fresh record.`
      );
    } else {
      setNickname('');

      setPrefilledNote(
        `Prefilled plant type "${getSpeciesName(record.plant_type)}". No nickname was stored in this historical record, so please enter one.`
      );
    }
  };

  const handleStartMonitoringClick = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedType) {
      setErrorMessage('Please select a valid plant type.');
      return;
    }

    const trimmed = nickname.trim();

    if (!trimmed) {
      setErrorMessage('Please enter a plant nickname.');
      return;
    }

    if (activePlant && activePlant.nickname) {
      setShowConfirmModal(true);
    } else {
      executeStartMonitoring();
    }
  };

  const executeStartMonitoring = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMessage(null);

    const trimmed = nickname.trim();

    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plant_type: selectedType,
          nickname: trimmed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.error ||
          `Failed to start monitoring plant (HTTP ${response.status}).`
        );
      }

      const created = await response.json();
      const matchedSpecies = getSpeciesName(created.plant_type);

      if (onPlantCreated) {
        onPlantCreated({
          nickname: created.nickname,
          plantType: created.plant_type,
          speciesName: matchedSpecies,
          startedAt: created.started_at,
        });
      }

      onNavigate('home');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'An error occurred while saving the plant.';

      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRecords = plantRecords.filter((p) => p.is_active);
  const historicalRecords = plantRecords.filter((p) => !p.is_active);

  return (
    <main className="max-w-md mx-auto px-4 pt-3 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <a
          href="#settings"
          aria-label="Back to Settings"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('settings');
          }}
          className="w-10 h-10 rounded-full bg-[#e2ebd9] hover:bg-[#d8e4d0] flex items-center justify-center text-[#203916] transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </a>

        <h1 className="font-lexend font-bold text-2xl text-[#161e13] leading-tight">
          Add a New Plant
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-[#ffdad6] border border-[#ffb4ab] text-[#93000a] rounded-2xl text-xs font-lexend flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {prefilledNote && (
        <div className="mb-4 p-3.5 bg-[#edf7e5] border border-[#ccecba] text-[#082103] rounded-2xl text-xs font-lexend flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#203916] shrink-0 mt-0.5" />
            <span>{prefilledNote}</span>
          </div>

          <button
            type="button"
            onClick={() => setPrefilledNote(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100 shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#316573]" />
            <h2 className="font-lexend font-bold text-sm text-[#161e13]">
              Saved &amp; Historical Plants
            </h2>
          </div>

          {recordsError && (
            <button
              type="button"
              onClick={fetchPlants}
              className="text-xs font-lexend text-[#203916] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
        </div>

        {loadingRecords ? (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white/70 border border-[#dce5d4] text-xs text-[#5c6457]">
            <Loader2 className="w-4 h-4 animate-spin text-[#203916]" />
            <span>Loading plant records from server...</span>
          </div>
        ) : recordsError ? (
          <div className="p-3.5 rounded-2xl bg-[#fff5ea] border border-[#ffdcbc] text-xs text-[#683d00] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{recordsError}</span>
          </div>
        ) : plantRecords.length === 0 ? (
          <div className="p-3.5 rounded-2xl bg-white/60 border border-[#dce5d4] text-xs text-[#5c6457]">
            No plant records found on server.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeRecords.map((active) => (
              <div
                key={active.id}
                className="p-3.5 rounded-2xl bg-[#edf7e5] border border-[#203916] shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-lexend font-bold text-sm text-[#161e13]">
                      {active.nickname || 'Unnamed Plant'}
                    </span>

                    <span className="text-xs text-[#43483f]">
                      · {getSpeciesName(active.plant_type)}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#203916] text-white text-[10px] font-lexend font-semibold">
                    Currently Active
                  </span>
                </div>

                <div className="text-[11px] text-[#5c6457]">
                  {formatMonitoringDates(
                    active.started_at,
                    active.ended_at
                  )}
                </div>
              </div>
            ))}

            {historicalRecords.map((historical) => {
              const hasNickname = Boolean(
                historical.nickname && historical.nickname.trim()
              );

              return (
                <div
                  key={historical.id}
                  className="p-3.5 rounded-2xl bg-white/80 border border-[#dce5d4] hover:border-[#b1cfa0] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-lexend font-bold text-xs text-[#161e13]">
                          {hasNickname
                            ? historical.nickname
                            : 'No nickname recorded'}
                        </span>

                        <span className="text-xs text-[#43483f]">
                          · {getSpeciesName(historical.plant_type)}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#5c6457] mt-0.5">
                        {formatMonitoringDates(
                          historical.started_at,
                          historical.ended_at
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-[#e2ebd9] text-[#203916] text-[10px] font-lexend font-semibold shrink-0">
                      Historical
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectHistoricalPlant(historical)}
                    className="w-full mt-1.5 py-1.5 px-3 rounded-xl bg-[#edf7e5] hover:bg-[#d8e4d0] text-[#203916] font-lexend font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Use as starting point</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleStartMonitoringClick}>
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block font-lexend font-bold text-sm text-[#161e13]">
              Select Plant Type
            </label>

            {typesError && (
              <button
                type="button"
                onClick={fetchPlantTypes}
                className="text-xs font-lexend text-[#203916] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>

          {loadingTypes ? (
            <div className="flex items-center gap-2 p-3 text-xs text-[#5c6457] bg-white/70 border border-[#dce5d4] rounded-2xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#203916]" />
              <span>Loading plant types from server...</span>
            </div>
          ) : typesError ? (
            <div className="p-3.5 rounded-2xl bg-[#fff5ea] border border-[#ffdcbc] text-xs text-[#683d00] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <div>
                <p className="font-semibold">{typesError}</p>
                <p className="mt-1 text-[11px]">
                  Cannot proceed without valid plant types from the server.
                </p>
              </div>
            </div>
          ) : plantTypes.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#fff5ea] border border-[#ffdcbc] text-xs text-[#683d00]">
              No plant types returned by the server.
            </div>
          ) : (
            <div className="space-y-2">
              {plantTypes.map((plant) => {
                const isSelected = selectedType === plant.id;

                return (
                  <div
                    key={plant.id}
                    onClick={() => setSelectedType(plant.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isSelected
                        ? 'bg-[#edf7e5] border-[#203916] shadow-xs'
                        : 'bg-white/70 border-[#dce5d4] hover:bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected
                            ? 'bg-[#203916] text-white'
                            : 'bg-[#e2ebd9] text-[#203916]'
                          }`}
                      >
                        <Leaf className="w-5 h-5" />
                      </div>

                      <span className="font-lexend font-semibold text-sm text-[#161e13]">
                        {plant.name}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ccecba] text-[#082103] text-[10px] font-lexend font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="plant-nickname-input"
            className="block font-lexend font-bold text-sm text-[#161e13] mb-1.5"
          >
            Plant Nickname
          </label>

          <input
            id="plant-nickname-input"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={isSubmitting || loadingTypes || plantTypes.length === 0}
            className="w-full h-12 px-3.5 rounded-xl bg-white border border-[#c4c8bc] font-lexend text-sm text-[#161e13] focus:outline-none focus:ring-2 focus:ring-[#203916] disabled:opacity-50"
            placeholder="e.g. Living room Monstera"
          />

          <span className="block text-[11px] text-[#5c6457] mt-1.5">
            You can customize or enter a new nickname for this monitoring
            session.
          </span>
        </div>

        <div>
          <button
            type="submit"
            id="btn-start-monitoring"
            disabled={
              isSubmitting ||
              loadingTypes ||
              plantTypes.length === 0 ||
              !selectedType
            }
            className="w-full h-14 bg-[#203916] hover:bg-[#2e4f20] text-white rounded-full font-lexend font-semibold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Starting Monitoring...</span>
              </>
            ) : (
              <>
                <Leaf className="w-4 h-4" />
                <span>Start Monitoring</span>
              </>
            )}
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-replace-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="max-w-sm w-full bg-[#f3fceb] border border-[#dce5d4] rounded-3xl p-6 shadow-xl space-y-4">
            <h3
              id="confirm-replace-title"
              className="font-lexend font-bold text-lg text-[#161e13]"
            >
              Replace active plant?
            </h3>

            <p className="text-xs text-[#43483f] leading-relaxed">
              Starting monitoring will end the current active session for{' '}
              <strong>{activePlant?.nickname || 'the active plant'}</strong>{' '}
              and start a new monitoring record for{' '}
              <strong>{nickname.trim()}</strong>.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={executeStartMonitoring}
                disabled={isSubmitting}
                className="w-full h-12 bg-[#203916] hover:bg-[#2e4f20] text-white rounded-full font-lexend font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Start Monitoring</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
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