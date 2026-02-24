import { Audio } from 'expo-av';

type AudioEvent = 'bgm' | 'roll' | 'move' | 'score' | 'capture' | 'win';

const AUDIO_SOURCES: Record<AudioEvent, number> = {
  bgm: require('../assets/audio/bgm/ancient-ambience.mp3'),
  roll: require('../assets/audio/sfx/roll.wav'),
  move: require('../assets/audio/sfx/move.wav'),
  score: require('../assets/audio/sfx/score.wav'),
  capture: require('../assets/audio/sfx/capture.wav'),
  win: require('../assets/audio/sfx/win.wav'),
};

const AUDIO_VOLUMES: Record<AudioEvent, number> = {
  bgm: 0.45,
  roll: 0.85,
  move: 0.7,
  score: 0.8,
  capture: 0.84,
  win: 0.88,
};

class GameAudio {
  private sounds: Partial<Record<AudioEvent, Audio.Sound>> = {};
  private warned = new Set<string>();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private warnOnce(id: string, message: string, error?: unknown) {
    if (this.warned.has(id)) return;
    this.warned.add(id);

    if (error) {
      console.warn(`[audio] ${message}`, error);
      return;
    }

    console.warn(`[audio] ${message}`);
  }

  private async ensureInit() {
    if (this.initialized) return;

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
  }

  private async initialize() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      this.warnOnce('audio-mode', 'Audio mode initialization failed. Continuing without guaranteed playback mode.', error);
    }

    await Promise.all(
      (Object.keys(AUDIO_SOURCES) as AudioEvent[]).map(async (eventKey) => {
        const sound = new Audio.Sound();

        try {
          await sound.loadAsync(
            AUDIO_SOURCES[eventKey],
            {
              isLooping: eventKey === 'bgm',
              shouldPlay: false,
              volume: AUDIO_VOLUMES[eventKey],
            },
            false,
          );
          this.sounds[eventKey] = sound;
        } catch (error) {
          this.warnOnce(
            `load-${eventKey}`,
            `Could not load ${eventKey} audio. Gameplay will continue without this sound.`,
            error,
          );
        }
      }),
    );

    this.initialized = true;
  }

  async start() {
    await this.ensureInit();
    await this.play('bgm');
  }

  async play(eventKey: AudioEvent) {
    await this.ensureInit();

    const sound = this.sounds[eventKey];
    if (!sound) {
      this.warnOnce(`missing-${eventKey}`, `Sound not available for ${eventKey}.`);
      return;
    }

    try {
      if (eventKey === 'bgm') {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          return;
        }

        await sound.playAsync();
        return;
      }

      await sound.replayAsync();
    } catch (error) {
      this.warnOnce(`play-${eventKey}`, `Failed to play ${eventKey} audio event.`, error);
    }
  }

  async stopAll() {
    const soundList = Object.values(this.sounds).filter((sound): sound is Audio.Sound => !!sound);

    await Promise.all(
      soundList.map(async (sound) => {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.stopAsync();
          }
          await sound.unloadAsync();
        } catch (error) {
          this.warnOnce('stop-unload', 'Error while unloading audio resources. Resources may stay allocated.', error);
        }
      }),
    );

    this.sounds = {};
    this.initialized = false;
    this.initPromise = null;
  }
}

export const gameAudio = new GameAudio();
