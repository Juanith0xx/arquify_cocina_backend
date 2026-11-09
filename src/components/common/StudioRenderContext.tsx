import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StudioRenderSettings {
  isRenderingMode: boolean;
  resolution: 'fhd' | '2k' | '4k';
  lightingPreset: 'warm' | 'daylight' | 'night_led';
  includePots: boolean;
  includePlants: boolean;
  includeHumanScale: boolean;
  enableSoftShadows: boolean;
  hideEdges: boolean;
}

interface StudioRenderContextType {
  settings: StudioRenderSettings;
  setSettings: React.Dispatch<React.SetStateAction<StudioRenderSettings>>;
  updateSetting: <K extends keyof StudioRenderSettings>(key: K, val: StudioRenderSettings[K]) => void;
  triggerRenderCapture: () => Promise<string | null>;
  registerCaptureHandler: (fn: () => Promise<string>) => void;
}

const defaultSettings: StudioRenderSettings = {
  isRenderingMode: false,
  resolution: '2k',
  lightingPreset: 'warm',
  includePots: true,
  includePlants: true,
  includeHumanScale: false,
  enableSoftShadows: true,
  hideEdges: true,
};

const StudioRenderContext = createContext<StudioRenderContextType | null>(null);

let activeCaptureHandler: (() => Promise<string>) | null = null;

export const StudioRenderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StudioRenderSettings>(defaultSettings);

  const updateSetting = <K extends keyof StudioRenderSettings>(key: K, val: StudioRenderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const registerCaptureHandler = (fn: () => Promise<string>) => {
    activeCaptureHandler = fn;
  };

  const triggerRenderCapture = async (): Promise<string | null> => {
    if (activeCaptureHandler) {
      return await activeCaptureHandler();
    }
    return null;
  };

  return (
    <StudioRenderContext.Provider
      value={{
        settings,
        setSettings,
        updateSetting,
        triggerRenderCapture,
        registerCaptureHandler,
      }}
    >
      {children}
    </StudioRenderContext.Provider>
  );
};

export function useStudioRender() {
  const ctx = useContext(StudioRenderContext);
  if (!ctx) {
    return {
      settings: defaultSettings,
      setSettings: () => {},
      updateSetting: () => {},
      triggerRenderCapture: async () => null,
      registerCaptureHandler: () => {},
    };
  }
  return ctx;
}
