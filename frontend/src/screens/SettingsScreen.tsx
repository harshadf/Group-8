import React, { useCallback, useEffect, useState } from 'react';
import {
  PlusCircle,
  Play,
  CheckCircle2,
  Leaf,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Screen, ActivePlant, PlantRecord } from '../types.ts';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
  onOpenDataInfo?: () => void;
  activePlant?: ActivePlant;
  onPlantDeleted?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigate,
  onOpenDataInfo,
  activePlant,
  onPlantDeleted,
}) => {
  const hasActivePlant = Boolean(activePlant && activePlant.nickname);
  const [plants, setPlants] = useState<PlantRecord[]>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const [plantsError, setPlantsError] = useState<string | null>(null);
  const [deletingPlantId, setDeletingPlantId] = useState<string | null>(null);

  const loadPlants = useCallback(async () => {
    setIsLoadingPlants(true);
    setPlantsError(null);

    try {
      const response = await fetch('/api/plants');
      if (!response.ok) {
        throw new Error(`Failed to load plants (HTTP ${response.status}).`);
      }

      const data = await response.json();
      const records: PlantRecord[] = Array.isArray(data?.plants)
        ? data.plants
        : Array.isArray(data)
          ? data
          : [];
      setPlants(records);
    } catch (error: unknown) {
      setPlantsError(
        error instanceof Error ? error.message : 'Unable to load saved plants.'
      );
    } finally {
      setIsLoadingPlants(false);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const handleDeletePlant = async (plant: PlantRecord) => {
    const plantId = String(plant.id);
    setDeletingPlantId(plantId);
    setPlantsError(null);

    try {
      const response = await fetch(`/api/plants/${encodeURIComponent(plantId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete plant (HTTP ${response.status}).`);
      }

      setPlants((currentPlants) => currentPlants.filter((item) => String(item.id) !== plantId));
      onPlantDeleted?.();
    } catch (error: unknown) {
      setPlantsError(
        error instanceof Error ? error.message : 'Unable to delete this plant.'
      );
    } finally {
      setDeletingPlantId(null);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-24">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-lexend font-bold text-2xl text-[#161e13]">Settings</h1>
        <p className="text-xs text-[#43483f]">Manage your monitored plant and app settings</p>
      </div>

      {/* Current Active Plant Section */}
      <div className="bg-white/90 border border-[#dce5d4] rounded-3xl p-5 mb-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#edf7e5] text-[#203916] flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-lexend font-bold text-base text-[#161e13]">
                Current Active Plant
              </h3>
              <span className="text-xs text-[#5c6457]">
                {hasActivePlant
                  ? `${activePlant!.nickname} · ${activePlant!.speciesName || activePlant!.plantType}`
                  : 'No active plant being monitored'}
              </span>
            </div>
          </div>
          {hasActivePlant && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#ccecba] text-[#082103] text-[11px] font-lexend font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          )}
        </div>

        {/* Action Buttons required by navigation spec */}
        <div className="space-y-2.5 mt-4">
          {/* Exact button ID: start-existing-btn */}
          <button
            id="start-existing-btn"
            onClick={() => onNavigate('home')}
            className="w-full h-13 bg-[#203916] hover:bg-[#2e4f20] text-white rounded-full font-lexend font-semibold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>View active plant dashboard</span>
          </button>

          {/* Exact button ID: tab-new-btn */}
          <button
            id="tab-new-btn"
            onClick={() => onNavigate('add-plant')}
            className="w-full h-13 bg-[#edf7e5] hover:bg-[#e2ebd9] border border-[#c4c8bc] text-[#161e13] rounded-full font-lexend font-semibold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#203916]" />
            <span>Start monitoring another plant</span>
          </button>
        </div>
      </div>

      <section className="bg-white/90 border border-[#dce5d4] rounded-3xl p-5 mb-5 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-[#edf7e5] text-[#203916] flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-lexend font-bold text-base text-[#161e13]">Your Plants</h2>
            <p className="text-xs text-[#5c6457]">Manage saved plant records</p>
          </div>
        </div>

        {isLoadingPlants ? (
          <p className="text-sm text-[#5c6457] py-2">Loading plants…</p>
        ) : plants.length === 0 && !plantsError ? (
          <p className="text-sm text-[#5c6457] py-2">No saved plants to manage.</p>
        ) : (
          <ul className="divide-y divide-[#e8eee3]">
            {plants.map((plant) => {
              const plantId = String(plant.id);
              const isActive = plant.active ?? plant.is_active ?? plant.ended_at === null;
              const name = plant.nickname?.trim() || plant.plant_type;
              const isDeleting = deletingPlantId === plantId;

              return (
                <li
                  key={plantId}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-lexend font-semibold text-sm text-[#161e13] truncate">
                      {name}
                    </p>
                    <p className="text-xs text-[#5c6457]">
                      {plant.plant_type}
                      {isActive ? ' · Active' : ' · Previous'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePlant(plant)}
                    disabled={deletingPlantId !== null}
                    aria-label={`Delete ${name}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e5c6c0] text-[#9f2d20] text-xs font-semibold hover:bg-[#fff1ee] disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {plantsError && (
          <p role="alert" className="text-sm text-[#9f2d20] mt-3">
            {plantsError}
          </p>
        )}
      </section>

      {/* Data & Privacy Section */}
      <div className="bg-white/80 border border-[#dce5d4] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#edf7e5] text-[#203916] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-lexend font-semibold text-xs text-[#161e13] block">
                Data &amp; Privacy
              </span>
              <span className="text-[11px] text-[#5c6457]">
                Learn how plant and sensor data is used
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenDataInfo}
            className="px-3 py-1.5 rounded-full bg-[#e2ebd9] hover:bg-[#d8e4d0] text-[#203916] text-xs font-lexend font-semibold transition-colors cursor-pointer"
          >
            Learn more about data
          </button>
        </div>
      </div>
    </main>
  );
};
