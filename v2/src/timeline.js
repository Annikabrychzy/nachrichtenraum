export const phases = [
  {
    type: "active",
    key: "slow",
    label: "LANGSAM",
    duration: 10,
    initial: 4,
    target: 20,
    intensity: 0.62,
    motion: 0.55,
    startRate: 980,
    endRate: 540,
    batch: 2,
  },
  {
    type: "active",
    key: "medium",
    label: "MITTEL",
    duration: 10,
    initial: 18,
    target: 64,
    intensity: 1.9,
    motion: 2.1,
    startRate: 260,
    endRate: 105,
    batch: 5,
  },
  {
    type: "active",
    key: "overload",
    label: "SCHNELL",
    duration: 10,
    initial: 52,
    target: 230,
    intensity: 5.8,
    motion: 5.4,
    startRate: 58,
    endRate: 16,
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
