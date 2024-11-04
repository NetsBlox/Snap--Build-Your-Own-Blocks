/* tslint:disable */
/* eslint-disable */
/**
 * @param {Uint8Array} content
 * @returns {string}
 */
export function translate_musicxml(content: Uint8Array): string;
/**
 * @param {Uint8Array} content
 * @returns {string}
 */
export function translate_midi(content: Uint8Array): string;
export enum Accidental {
  None = 0,
  Natural = 1,
  Sharp = 2,
  Flat = 3,
  DoubleSharp = 4,
  DoubleFlat = 5,
}
export enum ClefSymbol {
  GClef = 0,
  CClef = 1,
  FClef = 2,
}
export enum ClefType {
  Treble = 0,
  Bass = 1,
  FrenchViolin = 2,
  Subbass = 3,
  Tenor = 4,
  Alto = 5,
  Soprano = 6,
  MezzoSoprano = 7,
  Baritone = 8,
}
export enum DurationType {
  Maxima = 0,
  Long = 1,
  Breve = 2,
  Whole = 3,
  Half = 4,
  Quarter = 5,
  Eighth = 6,
  Sixteenth = 7,
  ThirtySecond = 8,
  SixtyFourth = 9,
  OneHundredTwentyEighth = 10,
  TwoHundredFiftySixth = 11,
  FiveHundredTwelfth = 12,
  OneThousandTwentyFourth = 13,
  TwoThousandFortyEighth = 14,
}
export enum KeyMode {
  Major = 0,
  Minor = 1,
}
export enum KeySignature {
  A = 0,
  ASharp = 1,
  AFlat = 2,
  B = 3,
  BFlat = 4,
  C = 5,
  CSharp = 6,
  CFlat = 7,
  D = 8,
  DSharp = 9,
  DFlat = 10,
  E = 11,
  EFlat = 12,
  F = 13,
  FSharp = 14,
  G = 15,
  GSharp = 16,
  GFlat = 17,
}
export enum PitchName {
  Rest = 0,
  A = 1,
  B = 2,
  C = 3,
  D = 4,
  E = 5,
  F = 6,
  G = 7,
}
export enum TempoMarking {
  Larghissimo = 0,
  Grave = 1,
  Largo = 2,
  Lento = 3,
  Larghetto = 4,
  Adagio = 5,
  Adagietto = 6,
  Andante = 7,
  Andantino = 8,
  MarciaModerato = 9,
  AndanteModerato = 10,
  Moderato = 11,
  Allegretto = 12,
  AllegroModerato = 13,
  Allegro = 14,
  Vivace = 15,
  Vivacissimo = 16,
  Allegrissimo = 17,
  AllegroVivace = 18,
  Presto = 19,
  Prestissimo = 20,
}
export enum TimeSignatureType {
  CommonTime = 0,
  CutTime = 1,
  Explicit = 2,
  None = 3,
}
export class Clef {
  free(): void;
  /**
   * @param {ClefType} clef_type
   * @param {ClefSymbol | undefined} [symbol]
   * @returns {Clef}
   */
  static new(clef_type: ClefType, symbol?: ClefSymbol): Clef;
  clef_type: ClefType;
  symbol: ClefSymbol;
}
export class Duration {
  free(): void;
  /**
   * @param {DurationType} value
   * @param {number} dots
   * @returns {Duration}
   */
  static new(value: DurationType, dots: number): Duration;
  /**
   * @param {Duration} beat_base_value
   * @param {number} beats
   * @returns {Duration}
   */
  static from_beats(beat_base_value: Duration, beats: number): Duration;
  /**
   * @param {Tempo} tempo
   * @param {number} duration
   * @returns {Duration}
   */
  static from_duration(tempo: Tempo, duration: number): Duration;
  /**
   * @returns {number}
   */
  value(): number;
  /**
   * @param {number} base_beat_value
   * @returns {number}
   */
  beats(base_beat_value: number): number;
  /**
   * @param {number} times
   * @returns {Duration}
   */
  split(times: number): Duration;
  dots: number;
  value: DurationType;
}
export class Key {
  free(): void;
  /**
   * @param {KeySignature} signature
   * @param {KeyMode} mode
   * @returns {Key}
   */
  static new(signature: KeySignature, mode: KeyMode): Key;
  /**
   * @param {number} fifths
   * @param {KeyMode | undefined} [mode]
   * @returns {Key}
   */
  static from_fifths(fifths: number, mode?: KeyMode): Key;
  /**
   * @returns {number}
   */
  fifths(): number;
  /**
   * @returns {Key}
   */
  to_parallel(): Key;
  /**
   * @returns {Key}
   */
  to_relative(): Key;
  make_parallel(): void;
  make_relative(): void;
  mode: KeyMode;
  signature: KeySignature;
}
export class Pitch {
  free(): void;
  /**
   * @param {PitchName} name
   * @param {number} octave
   * @returns {Pitch}
   */
  static new(name: PitchName, octave: number): Pitch;
  /**
   * @returns {Pitch}
   */
  static new_rest(): Pitch;
  /**
   * @returns {boolean}
   */
  is_rest(): boolean;
  name: PitchName;
  octave: number;
}
export class Tempo {
  free(): void;
  /**
   * @param {Duration} base_note
   * @param {number} beats_per_minute
   * @returns {Tempo}
   */
  static new(base_note: Duration, beats_per_minute: number): Tempo;
  base_note: Duration;
  beats_per_minute: number;
}
export class TempoSuggestion {
  free(): void;
  /**
   * @param {TempoMarking} marking
   * @returns {TempoSuggestion}
   */
  static new(marking: TempoMarking): TempoSuggestion;
  /**
   * @returns {string}
   */
  description(): string;
  /**
   * @returns {number}
   */
  bpm_min(): number;
  /**
   * @returns {number}
   */
  bpm_max(): number;
  /**
   * @returns {number}
   */
  value(): number;
  marking: TempoMarking;
}
export class TimeSignature {
  free(): void;
  /**
   * @param {TimeSignatureType} signature
   * @returns {TimeSignature}
   */
  static new(signature: TimeSignatureType): TimeSignature;
  /**
   * @param {number} numerator
   * @param {number} denominator
   * @returns {TimeSignature}
   */
  static new_explicit(numerator: number, denominator: number): TimeSignature;
  denominator: number;
  numerator: number;
  signature: TimeSignatureType;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly translate_musicxml: (a: number, b: number) => Array;
  readonly translate_midi: (a: number, b: number) => Array;
  readonly __wbg_tempo_free: (a: number, b: number) => void;
  readonly __wbg_get_tempo_base_note: (a: number) => number;
  readonly __wbg_set_tempo_base_note: (a: number, b: number) => void;
  readonly __wbg_get_tempo_beats_per_minute: (a: number) => number;
  readonly __wbg_set_tempo_beats_per_minute: (a: number, b: number) => void;
  readonly tempo_new: (a: number, b: number) => number;
  readonly __wbg_timesignature_free: (a: number, b: number) => void;
  readonly __wbg_get_timesignature_signature: (a: number) => number;
  readonly __wbg_set_timesignature_signature: (a: number, b: number) => void;
  readonly __wbg_get_timesignature_numerator: (a: number) => number;
  readonly __wbg_set_timesignature_numerator: (a: number, b: number) => void;
  readonly __wbg_get_timesignature_denominator: (a: number) => number;
  readonly __wbg_set_timesignature_denominator: (a: number, b: number) => void;
  readonly timesignature_new: (a: number) => number;
  readonly timesignature_new_explicit: (a: number, b: number) => number;
  readonly __wbg_key_free: (a: number, b: number) => void;
  readonly __wbg_get_key_mode: (a: number) => number;
  readonly __wbg_set_key_mode: (a: number, b: number) => void;
  readonly __wbg_get_key_signature: (a: number) => number;
  readonly __wbg_set_key_signature: (a: number, b: number) => void;
  readonly key_new: (a: number, b: number) => number;
  readonly key_from_fifths: (a: number, b: number) => number;
  readonly key_fifths: (a: number) => number;
  readonly key_to_parallel: (a: number) => number;
  readonly key_to_relative: (a: number) => number;
  readonly key_make_parallel: (a: number) => void;
  readonly key_make_relative: (a: number) => void;
  readonly __wbg_clef_free: (a: number, b: number) => void;
  readonly __wbg_get_clef_symbol: (a: number) => number;
  readonly __wbg_set_clef_symbol: (a: number, b: number) => void;
  readonly __wbg_get_clef_clef_type: (a: number) => number;
  readonly __wbg_set_clef_clef_type: (a: number, b: number) => void;
  readonly clef_new: (a: number, b: number) => number;
  readonly __wbg_pitch_free: (a: number, b: number) => void;
  readonly __wbg_get_pitch_name: (a: number) => number;
  readonly __wbg_set_pitch_name: (a: number, b: number) => void;
  readonly __wbg_get_pitch_octave: (a: number) => number;
  readonly __wbg_set_pitch_octave: (a: number, b: number) => void;
  readonly pitch_new: (a: number, b: number) => number;
  readonly pitch_new_rest: () => number;
  readonly pitch_is_rest: (a: number) => number;
  readonly __wbg_temposuggestion_free: (a: number, b: number) => void;
  readonly __wbg_get_temposuggestion_marking: (a: number) => number;
  readonly __wbg_set_temposuggestion_marking: (a: number, b: number) => void;
  readonly temposuggestion_new: (a: number) => number;
  readonly temposuggestion_description: (a: number) => Array;
  readonly temposuggestion_bpm_min: (a: number) => number;
  readonly temposuggestion_bpm_max: (a: number) => number;
  readonly temposuggestion_value: (a: number) => number;
  readonly __wbg_duration_free: (a: number, b: number) => void;
  readonly __wbg_get_duration_value: (a: number) => number;
  readonly __wbg_set_duration_value: (a: number, b: number) => void;
  readonly __wbg_get_duration_dots: (a: number) => number;
  readonly __wbg_set_duration_dots: (a: number, b: number) => void;
  readonly duration_new: (a: number, b: number) => number;
  readonly duration_from_beats: (a: number, b: number) => number;
  readonly duration_from_duration: (a: number, b: number) => number;
  readonly duration_value: (a: number) => number;
  readonly duration_beats: (a: number, b: number) => number;
  readonly duration_split: (a: number, b: number) => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
