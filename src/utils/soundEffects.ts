// Web Audio API Sound Synthesizer for UI Feedback
class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playClick(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playToggle(enabled: boolean = true, stateOn: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startFreq = stateOn ? 400 : 700;
      const endFreq = stateOn ? 800 : 350;

      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playColorSelect(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.04); // E5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.06);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.12);
    } catch (e) {
      // Ignore audio errors
    }
  }
  playLevelUp(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(440, now); // A4
      osc1.frequency.setValueAtTime(554.37, now + 0.08); // C#5
      osc2.frequency.setValueAtTime(659.25, now + 0.16); // E5
      osc2.frequency.setValueAtTime(880, now + 0.24); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.24);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.4);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playError(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(120, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Roulette Ticking sound when cards pass the center indicator needle
  playTick(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.018);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch (e) {
      // Ignore
    }
  }

  // Iconic Case Unlock / Key Turning & Heavy Latch Sound
  playCaseOpen(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Stage 1: Key Turning Metal Click (at 0s)
      const keyOsc = ctx.createOscillator();
      const keyGain = ctx.createGain();
      keyOsc.type = 'sine';
      keyOsc.frequency.setValueAtTime(2400, now);
      keyOsc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      keyGain.gain.setValueAtTime(0.2, now);
      keyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      keyOsc.connect(keyGain);
      keyGain.connect(ctx.destination);
      keyOsc.start(now);
      keyOsc.stop(now + 0.05);

      // Stage 2: Heavy Mechanical Lock Thud (at +0.06s)
      const lockTime = now + 0.06;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lockGain = ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(180, lockTime);
      osc1.frequency.exponentialRampToValueAtTime(30, lockTime + 0.3);

      osc2.frequency.setValueAtTime(320, lockTime);
      osc2.frequency.exponentialRampToValueAtTime(50, lockTime + 0.35);

      lockGain.gain.setValueAtTime(0.3, lockTime);
      lockGain.gain.exponentialRampToValueAtTime(0.001, lockTime + 0.4);

      osc1.connect(lockGain);
      osc2.connect(lockGain);
      lockGain.connect(ctx.destination);

      osc1.start(lockTime);
      osc1.stop(lockTime + 0.4);
      osc2.start(lockTime);
      osc2.stop(lockTime + 0.4);

      // Stage 3: Lid Opening Whir Sweep (at +0.15s)
      const sweepTime = now + 0.15;
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(300, sweepTime);
      sweepOsc.frequency.exponentialRampToValueAtTime(1200, sweepTime + 0.25);
      sweepGain.gain.setValueAtTime(0.08, sweepTime);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, sweepTime + 0.25);
      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start(sweepTime);
      sweepOsc.stop(sweepTime + 0.25);
    } catch (e) {
      // Ignore
    }
  }

  // Reveal fanfare tailored by item rarity
  playItemReveal(rarity: string, enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      if (rarity === 'common' || rarity === 'uncommon') {
        // Mil-Spec / Restricted clean chime
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.12, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
          osc.connect(gain);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.35);
        });
      } else if (rarity === 'rare' || rarity === 'epic') {
        // Classified / Covert triumphant fanfare
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.15, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.45);
          osc.connect(gain);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.45);
        });
      } else {
        // Rare Blade / Contraband / Sovereign Apex Legendary Symphony
        [392.00, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.18, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.6);
          osc.connect(gain);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.6);
        });
      }
    } catch (e) {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();
