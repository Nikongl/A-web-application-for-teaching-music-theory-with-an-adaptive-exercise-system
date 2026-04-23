// soundEngine.js — только реальный сэмпл, без синтеза
class SoundEngine {
  constructor() {
    this.audioContext = null;
    this.sampleBuffer = null;
    this.baseNote = 'C4';
  }

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async loadSample() {
    if (this.sampleBuffer) return this.sampleBuffer;
    const ctx = await this.initAudioContext();
    const url = '/sounds/piano/C4.wav';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    this.sampleBuffer = buffer;
    console.log('✅ Сэмпл загружен, звук реальный');
    return buffer;
  }

  getSemitones(targetNote) {
    const noteMap = {
      'C': 0, 'C#': 1, 'Db': 1,
      'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6,
      'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10,
      'Bb': 10, 'B': 11
    };
    const match = targetNote.match(/([A-G][b#]?)(\d)/);
    if (!match) return 0;
    const name = match[1];
    const octave = parseInt(match[2], 10);
    const baseMatch = this.baseNote.match(/([A-G][b#]?)(\d)/);
    const baseName = baseMatch[1];
    const baseOctave = parseInt(baseMatch[2], 10);
    let semitones = (octave - baseOctave) * 12;
    semitones += noteMap[name] - noteMap[baseName];
    return semitones;
  }

  async playNote(noteName, duration = 1.2) {
    const buffer = await this.loadSample();
    const ctx = await this.initAudioContext();
    const semitones = this.getSemitones(noteName);
    const ratio = Math.pow(2, semitones / 12);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = ratio;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.3;
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
  }
}

const soundEngine = new SoundEngine();
export default soundEngine;