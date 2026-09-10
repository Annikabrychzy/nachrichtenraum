export const phases = [
  {
    type: "active",
    key: "slow",
    label: "PHASE I · LANGSAM",
    duration: 5,
    initial: 5,
    target: 12,
    intensity: 0.55,
    startRate: 1200,
    endRate: 620,
    batch: 1,
  },
  { type: "pause", key: "silence-1", label: "PAUSE", duration: 2 },
  {
    type: "active",
    key: "medium",
    label: "PHASE II · VIELE",
    duration: 5,
    initial: 18,
    target: 45,
    intensity: 1.45,
    startRate: 260,
    endRate: 95,
    batch: 3,
  },
  { type: "pause", key: "silence-2", label: "PAUSE", duration: 2 },
  {
    type: "active",
    key: "overload",
    label: "PHASE III · ÜBERFLUTUNG",
    duration: 5,
    initial: 48,
    target: 72,
    intensity: 4.2,
    startRate: 60,
    endRate: 18,
    batch: 8,
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
