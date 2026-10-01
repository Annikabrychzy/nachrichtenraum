import { CardPool } from "./src/card-pool.js?v=rooms-13";

CardPool.prototype.randomPosition = function (cameraPosition) {
  const radius = this.THREE.MathUtils.lerp(3.25, 7.35, Math.pow(Math.random(), 0.7));
  const theta = Math.random() * Math.PI * 2;
  const vertical = this.THREE.MathUtils.lerp(-0.56, 0.58, Math.random());
  const planar = Math.sqrt(1 - vertical * vertical);
  return new this.THREE.Vector3(
    cameraPosition.x + Math.cos(theta) * planar * radius,
    cameraPosition.y + vertical * radius * 0.48,
    cameraPosition.z + Math.sin(theta) * planar * radius,
  );
};

CardPool.prototype.update = function (delta, intensity, now, cameraPosition) {
  let index = 0;
  for (const slot of this.active) {
    const position = slot.entity.object3D.position;
    const distance = position.distanceTo(cameraPosition);
    const minimum = slot.motionKind === "flyby" ? 1.15 : 1.45;

    // A card may approach, but it never waits directly in the viewer's face.
    if (distance < minimum || distance > 9.2) {
      slot.hoveredBy.clear();
      position.copy(this.randomPosition(cameraPosition));
      slot.entity.object3D.lookAt(cameraPosition);
      index += 1;
      continue;
    }

    if (!slot.paused && !slot.hoveredBy.size) {
      const age = (now - slot.bornAt) / 1000;
      const pop = Math.min(1, age / 0.34);
      const easeOutBack = 1 + 1.7 * Math.pow(pop - 1, 3) + 0.7 * Math.pow(pop - 1, 2);
      slot.entity.object3D.scale.setScalar((slot.baseScale || 1) * Math.max(0.12, easeOutBack));
      if (slot.motionKind !== "still") position.addScaledVector(slot.velocity, delta * intensity);
      const waveStrength = slot.motionKind === "still" ? 0.00045 : slot.motionKind === "flyby" ? 0.0068 : 0.0036;
      position.y += Math.sin(age * (1.2 + intensity * 0.22) + slot.wave) * waveStrength * intensity;
      if (index % 3 === Math.floor(now / 160) % 3) {
        slot.entity.object3D.lookAt(cameraPosition);
        slot.entity.object3D.rotateZ(Math.sin(slot.wave + age * 0.5) * 0.03 * intensity);
      }
    } else if (slot.hoveredBy.size) {
      // Targeting holds one card long enough to read; moving the pointer away releases it.
      slot.entity.object3D.lookAt(cameraPosition);
    }
    index += 1;
  }
};
