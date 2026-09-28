export const phases = [
  {
    type: "active",
    key: "slow",
    label: "WENIG",
    duration: 7,
    initial: 4,
    target: 18,
    intensity: 0.62,
    motion: 0.55,
    startRate: 900,
    endRate: 520,
    batch: 2,
  },
  {
    type: "active",
    key: "medium",
    label: "MITTEL",
    duration: 7,
    initial: 16,
    target: 54,
    intensity: 1.9,
    motion: 2.1,
    startRate: 240,
    endRate: 100,
    batch: 5,
  },
  {
    type: "active",
    key: "overload",
    label: "VIEL",
    duration: 7,
    initial: 44,
    target: 210,
    intensity: 5.8,
    motion: 5.4,
    startRate: 54,
    endRate: 14,
    batch: 18,
  },
];

export const cycleDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);

export function phaseAt(elapsedSeconds) {
  if (elapsedSeconds >= cycleDuration) return { index: phases.length, phase: null, progress: 1, cycleTime: cycleDuration, complete: true };
  let cycleTime = Math.max(0, elapsedSeconds);
  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index];
    if (cycleTime < phase.duration) return { index, phase, progress: cycleTime / phase.duration, cycleTime };
    cycleTime -= phase.duration;
  }
  return { index: 0, phase: phases[0], progress: 0, cycleTime: 0 };
}
