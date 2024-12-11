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
/**
 * Represents the symbol used to designate a clef.
 *
 * Note that the same symbol can be used for different clef types.
 */
export enum ClefSymbol {
  /**
   * ![G Clef](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/g-clef.png)
   */
  GClef = 0,
  /**
   * ![C Clef](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/c-clef.png)
   */
  CClef = 1,
  /**
   * ![F Clef](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/f-clef.png)
   */
  FClef = 2,
}
/**
 * Designates the meaning of a clef.
 *
 * A clef is used to determine the pitches for the notes on a staff.
 */
export enum ClefType {
  /**
   * Designates that pitch G4 is located on the second line from the bottom of the staff.
   */
  Treble = 0,
  /**
   * Designates that pitch F3 is located on the second line from the top of the staff.
   */
  Bass = 1,
  /**
   * Designates that pitch G4 is located on the bottom line of the staff.
   */
  FrenchViolin = 2,
  /**
   * Designates that pitch F3 is located on the top line of the staff.
   */
  Subbass = 3,
  /**
   * Designates that pitch C4 is located on the second line from the top of the staff.
   */
  Tenor = 4,
  /**
   * Designates that pitch C4 is located on the middle line of the staff.
   */
  Alto = 5,
  /**
   * Designates that pitch C4 is located on the bottom line of the staff.
   */
  Soprano = 6,
  /**
   * Designates that pitch C4 is located on the second line from the bottom of the staff.
   */
  MezzoSoprano = 7,
  /**
   * Designates that pitch C4 is located on the top line of the staff.
   */
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
/**
 * Represents the relative interval between notes in musical scale.
 */
export enum KeyMode {
  /**
   * Represents the following note intervals in semitones,
   * starting from the root note of the corresponding key:
   *
   * `[2, 2, 1, 2, 2, 2, 1]`
   */
  Major = 0,
  /**
   * Represents the following note intervals in semitones,
   * starting from the root note of the corresponding key:
   *
   * `[2, 1, 2, 2, 2, 1, 2]`
   */
  Minor = 1,
}
/**
 * Represents the key signature of a musical piece, not taking
 * into account its mode (i.e., major or minor).
 */
export enum KeySignature {
  /**
   * ![Key of A](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-a.png)
   */
  A = 0,
  /**
   * ![Key of A#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-a-sharp.png)
   */
  ASharp = 1,
  /**
   * ![Key of A♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-a-flat.png)
   */
  AFlat = 2,
  /**
   * ![Key of B](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-b.png)
   */
  B = 3,
  /**
   * ![Key of B♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-b-flat.png)
   */
  BFlat = 4,
  /**
   * ![Key of C](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-c.png)
   */
  C = 5,
  /**
   * ![Key of C#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-c-sharp.png)
   */
  CSharp = 6,
  /**
   * ![Key of C♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-c-flat.png)
   */
  CFlat = 7,
  /**
   * ![Key of D](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-d.png)
   */
  D = 8,
  /**
   * ![Key of D#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-d-sharp.png)
   */
  DSharp = 9,
  /**
   * ![Key of D♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-d-flat.png)
   */
  DFlat = 10,
  /**
   * ![Key of E](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-e.png)
   */
  E = 11,
  /**
   * ![Key of E♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-e-flat.png)
   */
  EFlat = 12,
  /**
   * ![Key of F](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-f.png)
   */
  F = 13,
  /**
   * ![Key of F#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-f-sharp.png)
   */
  FSharp = 14,
  /**
   * ![Key of G](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-g.png)
   */
  G = 15,
  /**
   * ![Key of G#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-g-sharp.png)
   */
  GSharp = 16,
  /**
   * ![Key of G♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-g-flat.png)
   */
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
/**
 * Represents a text-based tempo marking in music notation.
 */
export enum TempoMarking {
  /**
   * Very, very slowly.
   */
  Larghissimo = 0,
  /**
   * Very slowly.
   */
  Grave = 1,
  /**
   * Broadly.
   */
  Largo = 2,
  /**
   * Slowly.
   */
  Lento = 3,
  /**
   * Rather broadly.
   */
  Larghetto = 4,
  /**
   * Slowly and stately.
   */
  Adagio = 5,
  /**
   * More slowly than andante.
   */
  Adagietto = 6,
  /**
   * At a walking pace.
   */
  Andante = 7,
  /**
   * At a brisk walking pace.
   */
  Andantino = 8,
  /**
   * Moderately, in the manner of a march.
   */
  MarciaModerato = 9,
  /**
   * Between andante and moderato.
   */
  AndanteModerato = 10,
  /**
   * Moderately.
   */
  Moderato = 11,
  /**
   * Moderately quickly.
   */
  Allegretto = 12,
  /**
   * Brightly and moderately quickly.
   */
  AllegroModerato = 13,
  /**
   * Quickly and brightly.
   */
  Allegro = 14,
  /**
   * Lively and fast.
   */
  Vivace = 15,
  /**
   * Very fast and lively.
   */
  Vivacissimo = 16,
  /**
   * Very fast.
   */
  Allegrissimo = 17,
  /**
   * Very lively and fast.
   */
  AllegroVivace = 18,
  /**
   * Very, very fast.
   */
  Presto = 19,
  /**
   * Extremely fast.
   */
  Prestissimo = 20,
}
/**
 * Represents a type of time signature marking, whether explicit or implicit.
 */
export enum TimeSignatureType {
  /**
   * ![Common Time](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/common-time.png)
   *
   * Represents an explicit time signature of 4/4.
   */
  CommonTime = 0,
  /**
   * ![Cut Time](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/cut-time.png)
   *
   * Represents an explicit time signature of 2/2.
   */
  CutTime = 1,
  /**
   * ![Explicit Time](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/explicit-time.png)
   *
   * Represents the number of beats in each measure and the
   * note value which represents a beat.
   */
  Explicit = 2,
  /**
   * Represents an explicit lack of time signature,
   * also called "senza misura".
   */
  None = 3,
}
/**
 * Represents a clef which is used to determine the pitches for the notes on a staff.
 */
export class Clef {
  free(): void;
  /**
   * Creates a new clef with the given type and optional symbol.
   *
   * If the `symbol` parameter is `None`, the most common symbol for the
   * given `clef_type` will be used instead.
   * @param {ClefType} clef_type
   * @param {ClefSymbol | undefined} [symbol]
   * @returns {Clef}
   */
  static new(clef_type: ClefType, symbol?: ClefSymbol): Clef;
/**
 * The meaning of the clef.
 */
  clef_type: ClefType;
/**
 * The symbol used to designate the clef.
 */
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
/**
 * Represents the key of a musical piece, including both its
 * mode (i.e., major or minor) and its signature.
 */
export class Key {
  free(): void;
  /**
   * Creates a new key with the given signature and mode.
   * @param {KeySignature} signature
   * @param {KeyMode} mode
   * @returns {Key}
   */
  static new(signature: KeySignature, mode: KeyMode): Key;
  /**
   * Creates a new key from the given circle of fifths value and
   * optional mode.
   *
   * The circle of fifths represents the number of flats or sharps in
   * a traditional key signature. Negative numbers are used for flats
   * and positive numbers for sharps. For example, a key with two flats
   * would be represented by a `fifths` value of `-2`.
   *
   * If the `mode` parameter is `None`, the key will default
   * to [`KeyMode::Major`].
   * @param {number} fifths
   * @param {KeyMode | undefined} [mode]
   * @returns {Key}
   */
  static from_fifths(fifths: number, mode?: KeyMode): Key;
  /**
   * Returns the circle of fifths value for the key.
   *
   * The circle of fifths represents the number of flats or sharps in
   * a traditional key signature. Negative numbers are used for flats
   * and positive numbers for sharps. For example, a key with two flats
   * would be represented by a `fifths` value of `-2`.
   * @returns {number}
   */
  fifths(): number;
  /**
   * Returns a new key with the same tonic as the current key,
   * but with the opposite mode (i.e., the parallel key of C-Major
   * would be C-Minor and vice versa).
   * @returns {Key}
   */
  to_parallel(): Key;
  /**
   * Returns a new key with the same accidentals as the current key,
   * but with the opposite mode (i.e., the relative key of C-Major
   * would be A-Minor and vice versa).
   * @returns {Key}
   */
  to_relative(): Key;
  /**
   * Converts the current key into its parallel key.
   *
   * A parallel key is a key with the same tonic as the current key,
   * but with the opposite mode (i.e., the parallel key of C-Major
   * would be C-Minor and vice versa).
   */
  make_parallel(): void;
  /**
   * Converts the current key into its relative key.
   *
   * A relative key is a key with the same accidentals as the current
   * key, but with the opposite mode (i.e., the relative key of C-Major
   * would be A-Minor and vice versa).
   */
  make_relative(): void;
/**
 * The mode of the key (i.e., major or minor).
 */
  mode: KeyMode;
/**
 * The signature of the key (i.e., A, A♭, B, etc).
 */
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
/**
 * Represents an explicit tempo marking in music notation.
 */
export class Tempo {
  free(): void;
  /**
   * Creates a new tempo with the given base note and beats per minute.
   * @param {Duration} base_note
   * @param {number} beats_per_minute
   * @returns {Tempo}
   */
  static new(base_note: Duration, beats_per_minute: number): Tempo;
/**
 * The base note which represents a "beat" in the tempo.
 */
  base_note: Duration;
/**
 * The number of beats per minute.
 */
  beats_per_minute: number;
}
/**
 * Represents a text-based tempo suggestion in music notation.
 */
export class TempoSuggestion {
  free(): void;
  /**
   * Creates a new tempo suggestion with the given marking.
   * @param {TempoMarking} marking
   * @returns {TempoSuggestion}
   */
  static new(marking: TempoMarking): TempoSuggestion;
  /**
   * Returns a description of the tempo suggestion.
   * @returns {string}
   */
  description(): string;
  /**
   * Returns the minimum beats per minute for the tempo suggestion.
   * @returns {number}
   */
  bpm_min(): number;
  /**
   * Returns the maximum beats per minute for the tempo suggestion.
   * @returns {number}
   */
  bpm_max(): number;
  /**
   * Returns the average beats per minute for the tempo suggestion.
   * @returns {number}
   */
  value(): number;
  marking: TempoMarking;
}
/**
 * Represents a time signature in music notation.
 *
 * Some `signature` types are implicit (e.g., `CommonTime` = `4/4`,
 * `CutTime` = `2/2`), while others require an explicit `numerator` and `denominator`.
 */
export class TimeSignature {
  free(): void;
  /**
   * Creates a new time signature with the given *implicit* type.
   *
   * **Note:** This method should only be used for implicit time
   * signatures like [`TimeSignatureType::CommonTime`] and
   * [`TimeSignatureType::CutTime`]. If you need to create an explicit
   * time signature, use [`TimeSignature::new_explicit`] instead.
   * @param {TimeSignatureType} signature
   * @returns {TimeSignature}
   */
  static new(signature: TimeSignatureType): TimeSignature;
  /**
   * Creates a new time signature with the given *explicit* type.
   *
   * The `numerator` indicates the number of beats in each measure,
   * and the `denominator` designates the note value which represents
   * a beat in the measure (e.g., `4` = quarter note, `8` = eighth note,
   * etc.).
   * @param {number} numerator
   * @param {number} denominator
   * @returns {TimeSignature}
   */
  static new_explicit(numerator: number, denominator: number): TimeSignature;
/**
 * The note value which represents a beat in the measure (e.g.,
 * `4` = quarter note, `8` = eighth note, etc.).
 */
  denominator: number;
/**
 * The number of beats in each measure.
 */
  numerator: number;
/**
 * The type of time signature marking, whether explicit or implicit.
 */
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
  readonly __wbg_clef_free: (a: number, b: number) => void;
  readonly __wbg_get_clef_symbol: (a: number) => number;
  readonly __wbg_set_clef_symbol: (a: number, b: number) => void;
  readonly __wbg_get_clef_clef_type: (a: number) => number;
  readonly __wbg_set_clef_clef_type: (a: number, b: number) => void;
  readonly clef_new: (a: number, b: number) => number;
  readonly __wbg_timesignature_free: (a: number, b: number) => void;
  readonly __wbg_get_timesignature_signature: (a: number) => number;
  readonly __wbg_set_timesignature_signature: (a: number, b: number) => void;
  readonly __wbg_get_timesignature_denominator: (a: number) => number;
  readonly __wbg_set_timesignature_denominator: (a: number, b: number) => void;
  readonly timesignature_new: (a: number) => number;
  readonly timesignature_new_explicit: (a: number, b: number) => number;
  readonly __wbg_pitch_free: (a: number, b: number) => void;
  readonly __wbg_get_pitch_name: (a: number) => number;
  readonly __wbg_set_pitch_name: (a: number, b: number) => void;
  readonly __wbg_get_pitch_octave: (a: number) => number;
  readonly __wbg_set_pitch_octave: (a: number, b: number) => void;
  readonly pitch_new: (a: number, b: number) => number;
  readonly pitch_new_rest: () => number;
  readonly pitch_is_rest: (a: number) => number;
  readonly __wbg_set_timesignature_numerator: (a: number, b: number) => void;
  readonly __wbg_get_timesignature_numerator: (a: number) => number;
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
