export const phases = [
  {
    type: "active",
    key: "slow",
    label: "PHASE I · LANGSAM",
    duration: 10,
    initial: 3,
    target: 14,
    intensity: 0.52,
    motion: 0.45,
    startRate: 1050,
    endRate: 620,
    batch: 2,
  },
  { type: "pause", key: "silence-1", label: "PAUSE", duration: 3 },
  {
    type: "active",
    key: "medium",
    label: "PHASE II · MITTEL",
    duration: 10,
    initial: 14,
    target: 42,
    intensity: 1.7,
    motion: 1.8,
    startRate: 310,
    endRate: 120,
    batch: 4,
  },
  { type: "pause", key: "silence-2", label: "PAUSE", duration: 3 },
  {
    type: "active",
    key: "overload",
    label: "PHASE III · CHAOS",
    duration: 10,
    initial: 36,
    target: 196,
    intensity: 5.2,
    motion: 4.8,
    startRate: 75,
    endRate: 16,
    batch: 16,
  },
];

export const cycleDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);

export function phaseAt(elapsedSeconds) {
  let cycleTime = ((elapsedSeconds % cycleDuration) + cycleDuration) % cycleDuration;
  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index];
    if (cycleTime < phase.duration) {
      return { index, phase, progress: cycleTime / phase.duration, cycleTime };
    }
    cycleTime -= phase.duration;
  }
  return { index: 0, phase: phases[0], progress: 0, cycleTime: 0 };
}
