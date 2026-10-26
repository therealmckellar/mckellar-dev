/**
 * Synthetic Web Audio API Chime & Tone Generator
 * Generates crisp crystal chimes without external audio assets or network requests.
 */

class RetinaAudioService {
    private ctx: AudioContext | null = null;
    private soundEnabled = true;

    constructor() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('retina_sound_enabled');
            this.soundEnabled = saved !== null ? saved === 'true' : true;
        }
    }

    public isSoundEnabled(): boolean {
        return this.soundEnabled;
    }

    public setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('retina_sound_enabled', String(enabled));
        }
    }

    private initContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    /**
     * Crisp pleasant glass chime for email opens (880Hz -> 1320Hz double chime)
     */
    public playOpenChime(): void {
        if (!this.soundEnabled) return;
        try {
            const ctx = this.initContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now);
            gain1.gain.setValueAtTime(0.12, now);
            gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1318.51, now + 0.08);
            gain2.gain.setValueAtTime(0.15, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.55);
        } catch (e) {
            console.warn('Audio chime error:', e);
        }
    }

    /**
     * Vibrant rising chime for link clicks or hot open spikes
     */
    public playSpikeChime(): void {
        if (!this.soundEnabled) return;
        try {
            const ctx = this.initContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const freqs = [783.99, 987.77, 1318.51, 1567.98];
            freqs.forEach((freq, idx) => {
                const noteTime = now + idx * 0.06;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.14, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.3);
            });
        } catch (e) {
            console.warn('Spike chime error:', e);
        }
    }
}

export const retinaAudio = new RetinaAudioService();
