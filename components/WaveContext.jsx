import { createContext, useContext, useRef } from 'react';

const WaveContext = createContext(null);

export function WaveProvider({ children }) {
  const wave = useRef(0);
  return <WaveContext.Provider value={wave}>{children}</WaveContext.Provider>;
}

export function useWave() {
  return useContext(WaveContext);
}
