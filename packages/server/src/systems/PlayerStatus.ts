export class PlayerStatusEffects {
  slowFactor = 1;
  slowTimerSec = 0;
  speedBoostFactor = 1;
  speedBoostTimerSec = 0;
  invulnTimerSec = 0;
  burnDps = 0;
  burnTimerSec = 0;
  burnAttackerId: string | null = null;
  burnAccumDamage = 0;
  timeSinceDamageSec = 0;
  regenAccumHp = 0;
  secondWindAvailable = true;

  reset(): void {
    this.slowFactor = 1;
    this.slowTimerSec = 0;
    this.speedBoostFactor = 1;
    this.speedBoostTimerSec = 0;
    this.invulnTimerSec = 0;
    this.burnDps = 0;
    this.burnTimerSec = 0;
    this.burnAttackerId = null;
    this.burnAccumDamage = 0;
    this.timeSinceDamageSec = 0;
    this.regenAccumHp = 0;
    this.secondWindAvailable = true;
  }

  applySlow(factor: number, durationSec: number): void {
    const clamped = Math.max(0.25, Math.min(1, factor));
    if (clamped < this.slowFactor || this.slowTimerSec <= 0) {
      this.slowFactor = clamped;
    }
    this.slowTimerSec = Math.max(this.slowTimerSec, durationSec);
  }

  applySpeedBoost(multiplier: number, durationSec: number): void {
    const clamped = Math.max(1, Math.min(2.2, multiplier));
    if (clamped > this.speedBoostFactor || this.speedBoostTimerSec <= 0) {
      this.speedBoostFactor = clamped;
    }
    this.speedBoostTimerSec = Math.max(this.speedBoostTimerSec, durationSec);
  }

  applyBurn(dps: number, durationSec: number, attackerId: string | null): void {
    if (dps <= 0 || durationSec <= 0) return;
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnTimerSec = Math.max(this.burnTimerSec, durationSec);
    this.burnAttackerId = attackerId;
  }

  setInvulnerable(durationSec: number): void {
    this.invulnTimerSec = Math.max(this.invulnTimerSec, durationSec);
  }

  isInvulnerable(): boolean {
    return this.invulnTimerSec > 0;
  }

  getSpeedMultiplier(): number {
    const slow = this.slowTimerSec > 0 ? this.slowFactor : 1;
    const boost = this.speedBoostTimerSec > 0 ? this.speedBoostFactor : 1;
    return slow * boost;
  }

  step(
    dt: number,
    isAlive: boolean,
    hp: number,
    maxHp: number,
    regenPerSec: number,
    regenDelaySec: number,
    onHeal: (amount: number) => void,
  ): void {
    if (this.slowTimerSec > 0) {
      this.slowTimerSec = Math.max(0, this.slowTimerSec - dt);
      if (this.slowTimerSec === 0) this.slowFactor = 1;
    }
    if (this.speedBoostTimerSec > 0) {
      this.speedBoostTimerSec = Math.max(0, this.speedBoostTimerSec - dt);
      if (this.speedBoostTimerSec === 0) this.speedBoostFactor = 1;
    }
    if (this.invulnTimerSec > 0) {
      this.invulnTimerSec = Math.max(0, this.invulnTimerSec - dt);
    }
    if (isAlive) {
      this.timeSinceDamageSec += dt;
      if (regenPerSec > 0 && this.timeSinceDamageSec >= regenDelaySec && hp < maxHp) {
        this.regenAccumHp += regenPerSec * dt;
        const whole = Math.floor(this.regenAccumHp);
        if (whole >= 1) {
          this.regenAccumHp -= whole;
          onHeal(whole);
        }
      }
    }
  }
}
