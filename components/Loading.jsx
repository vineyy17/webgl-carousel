import { useProgress } from '@react-three/drei';

export default function Loading() {
  const { progress, active } = useProgress();
  const pct = Math.min(100, Math.round(progress));

  return (
    <div className={`loader${active ? ' is-active' : ' is-done'}`} aria-live="polite">
      <div className="loader-inner">
        <p className="loader-label">Loading scene</p>
        <div className="loader-track">
          <div className="loader-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="loader-pct">{pct}%</p>
      </div>
    </div>
  );
}
