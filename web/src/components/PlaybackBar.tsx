import { useMapStore } from "../store/useMapStore";
import { PLAYBACK_WINDOW_S, playbackLabel } from "../lib/playback";

/** Bottom scrub bar shown while time playback is active. */
export default function PlaybackBar() {
  const offset = useMapStore((s) => s.playbackOffsetSec);
  const setOffset = useMapStore((s) => s.setPlaybackOffset);
  const togglePlayback = useMapStore((s) => s.togglePlayback);

  return (
    <div className="playback-bar">
      <span className="playback-title">⏱ Playback</span>
      <input
        type="range"
        min={-PLAYBACK_WINDOW_S}
        max={0}
        step={5}
        value={offset}
        onChange={(e) => setOffset(Number(e.target.value))}
        aria-label="Rewind the picture"
      />
      <span className={`playback-time${offset === 0 ? " live" : ""}`}>{playbackLabel(offset)}</span>
      <button className="playback-close" onClick={togglePlayback} aria-label="Exit playback">
        ✕
      </button>
    </div>
  );
}
