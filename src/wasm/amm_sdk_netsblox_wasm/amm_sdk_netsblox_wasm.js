let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_0.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * @param {Uint8Array} content
 * @returns {string}
 */
export function translate_musicxml(content) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(content, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.translate_musicxml(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {Uint8Array} content
 * @returns {string}
 */
export function translate_midi(content) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(content, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.translate_midi(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

export const Accidental = Object.freeze({ None:0,"0":"None",Natural:1,"1":"Natural",Sharp:2,"2":"Sharp",Flat:3,"3":"Flat",DoubleSharp:4,"4":"DoubleSharp",DoubleFlat:5,"5":"DoubleFlat", });
/**
 * Represents the symbol used to designate a clef.
 *
 * Note that the same symbol can be used for different clef types.
 */
export const ClefSymbol = Object.freeze({
/**
 * ![G Clef](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/g-clef.png)
 */
GClef:0,"0":"GClef",
/**
 * ![C Clef](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/c-clef.png)
 */
CClef:1,"1":"CClef",
/**
 * ![F Clef](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/f-clef.png)
 */
FClef:2,"2":"FClef", });
/**
 * Designates the meaning of a clef.
 *
 * A clef is used to determine the pitches for the notes on a staff.
 */
export const ClefType = Object.freeze({
/**
 * Designates that pitch G4 is located on the second line from the bottom of the staff.
 */
Treble:0,"0":"Treble",
/**
 * Designates that pitch F3 is located on the second line from the top of the staff.
 */
Bass:1,"1":"Bass",
/**
 * Designates that pitch G4 is located on the bottom line of the staff.
 */
FrenchViolin:2,"2":"FrenchViolin",
/**
 * Designates that pitch F3 is located on the top line of the staff.
 */
Subbass:3,"3":"Subbass",
/**
 * Designates that pitch C4 is located on the second line from the top of the staff.
 */
Tenor:4,"4":"Tenor",
/**
 * Designates that pitch C4 is located on the middle line of the staff.
 */
Alto:5,"5":"Alto",
/**
 * Designates that pitch C4 is located on the bottom line of the staff.
 */
Soprano:6,"6":"Soprano",
/**
 * Designates that pitch C4 is located on the second line from the bottom of the staff.
 */
MezzoSoprano:7,"7":"MezzoSoprano",
/**
 * Designates that pitch C4 is located on the top line of the staff.
 */
Baritone:8,"8":"Baritone", });

export const DurationType = Object.freeze({ Maxima:0,"0":"Maxima",Long:1,"1":"Long",Breve:2,"2":"Breve",Whole:3,"3":"Whole",Half:4,"4":"Half",Quarter:5,"5":"Quarter",Eighth:6,"6":"Eighth",Sixteenth:7,"7":"Sixteenth",ThirtySecond:8,"8":"ThirtySecond",SixtyFourth:9,"9":"SixtyFourth",OneHundredTwentyEighth:10,"10":"OneHundredTwentyEighth",TwoHundredFiftySixth:11,"11":"TwoHundredFiftySixth",FiveHundredTwelfth:12,"12":"FiveHundredTwelfth",OneThousandTwentyFourth:13,"13":"OneThousandTwentyFourth",TwoThousandFortyEighth:14,"14":"TwoThousandFortyEighth", });
/**
 * Represents the relative interval between notes in musical scale.
 */
export const KeyMode = Object.freeze({
/**
 * Represents the following note intervals in semitones,
 * starting from the root note of the corresponding key:
 *
 * `[2, 2, 1, 2, 2, 2, 1]`
 */
Major:0,"0":"Major",
/**
 * Represents the following note intervals in semitones,
 * starting from the root note of the corresponding key:
 *
 * `[2, 1, 2, 2, 2, 1, 2]`
 */
Minor:1,"1":"Minor", });
/**
 * Represents the key signature of a musical piece, not taking
 * into account its mode (i.e., major or minor).
 */
export const KeySignature = Object.freeze({
/**
 * ![Key of A](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-a.png)
 */
A:0,"0":"A",
/**
 * ![Key of A#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-a-sharp.png)
 */
ASharp:1,"1":"ASharp",
/**
 * ![Key of A♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-a-flat.png)
 */
AFlat:2,"2":"AFlat",
/**
 * ![Key of B](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-b.png)
 */
B:3,"3":"B",
/**
 * ![Key of B♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-b-flat.png)
 */
BFlat:4,"4":"BFlat",
/**
 * ![Key of C](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-c.png)
 */
C:5,"5":"C",
/**
 * ![Key of C#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-c-sharp.png)
 */
CSharp:6,"6":"CSharp",
/**
 * ![Key of C♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-c-flat.png)
 */
CFlat:7,"7":"CFlat",
/**
 * ![Key of D](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-d.png)
 */
D:8,"8":"D",
/**
 * ![Key of D#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-d-sharp.png)
 */
DSharp:9,"9":"DSharp",
/**
 * ![Key of D♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-d-flat.png)
 */
DFlat:10,"10":"DFlat",
/**
 * ![Key of E](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-e.png)
 */
E:11,"11":"E",
/**
 * ![Key of E♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-e-flat.png)
 */
EFlat:12,"12":"EFlat",
/**
 * ![Key of F](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-f.png)
 */
F:13,"13":"F",
/**
 * ![Key of F#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-f-sharp.png)
 */
FSharp:14,"14":"FSharp",
/**
 * ![Key of G](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-g.png)
 */
G:15,"15":"G",
/**
 * ![Key of G#](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-g-sharp.png)
 */
GSharp:16,"16":"GSharp",
/**
 * ![Key of G♭](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/key-g-flat.png)
 */
GFlat:17,"17":"GFlat", });

export const PitchName = Object.freeze({ Rest:0,"0":"Rest",A:1,"1":"A",B:2,"2":"B",C:3,"3":"C",D:4,"4":"D",E:5,"5":"E",F:6,"6":"F",G:7,"7":"G", });
/**
 * Represents a text-based tempo marking in music notation.
 */
export const TempoMarking = Object.freeze({
/**
 * Very, very slowly.
 */
Larghissimo:0,"0":"Larghissimo",
/**
 * Very slowly.
 */
Grave:1,"1":"Grave",
/**
 * Broadly.
 */
Largo:2,"2":"Largo",
/**
 * Slowly.
 */
Lento:3,"3":"Lento",
/**
 * Rather broadly.
 */
Larghetto:4,"4":"Larghetto",
/**
 * Slowly and stately.
 */
Adagio:5,"5":"Adagio",
/**
 * More slowly than andante.
 */
Adagietto:6,"6":"Adagietto",
/**
 * At a walking pace.
 */
Andante:7,"7":"Andante",
/**
 * At a brisk walking pace.
 */
Andantino:8,"8":"Andantino",
/**
 * Moderately, in the manner of a march.
 */
MarciaModerato:9,"9":"MarciaModerato",
/**
 * Between andante and moderato.
 */
AndanteModerato:10,"10":"AndanteModerato",
/**
 * Moderately.
 */
Moderato:11,"11":"Moderato",
/**
 * Moderately quickly.
 */
Allegretto:12,"12":"Allegretto",
/**
 * Brightly and moderately quickly.
 */
AllegroModerato:13,"13":"AllegroModerato",
/**
 * Quickly and brightly.
 */
Allegro:14,"14":"Allegro",
/**
 * Lively and fast.
 */
Vivace:15,"15":"Vivace",
/**
 * Very fast and lively.
 */
Vivacissimo:16,"16":"Vivacissimo",
/**
 * Very fast.
 */
Allegrissimo:17,"17":"Allegrissimo",
/**
 * Very lively and fast.
 */
AllegroVivace:18,"18":"AllegroVivace",
/**
 * Very, very fast.
 */
Presto:19,"19":"Presto",
/**
 * Extremely fast.
 */
Prestissimo:20,"20":"Prestissimo", });
/**
 * Represents a type of time signature marking, whether explicit or implicit.
 */
export const TimeSignatureType = Object.freeze({
/**
 * ![Common Time](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/common-time.png)
 *
 * Represents an explicit time signature of 4/4.
 */
CommonTime:0,"0":"CommonTime",
/**
 * ![Cut Time](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/cut-time.png)
 *
 * Represents an explicit time signature of 2/2.
 */
CutTime:1,"1":"CutTime",
/**
 * ![Explicit Time](https://hedgetechllc.github.io/amm-sdk/amm_sdk/images/explicit-time.png)
 *
 * Represents the number of beats in each measure and the
 * note value which represents a beat.
 */
Explicit:2,"2":"Explicit",
/**
 * Represents an explicit lack of time signature,
 * also called "senza misura".
 */
None:3,"3":"None", });

const ClefFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_clef_free(ptr >>> 0, 1));
/**
 * Represents a clef which is used to determine the pitches for the notes on a staff.
 */
export class Clef {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Clef.prototype);
        obj.__wbg_ptr = ptr;
        ClefFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ClefFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_clef_free(ptr, 0);
    }
    /**
     * The symbol used to designate the clef.
     * @returns {ClefSymbol}
     */
    get symbol() {
        const ret = wasm.__wbg_get_clef_symbol(this.__wbg_ptr);
        return ret;
    }
    /**
     * The symbol used to designate the clef.
     * @param {ClefSymbol} arg0
     */
    set symbol(arg0) {
        wasm.__wbg_set_clef_symbol(this.__wbg_ptr, arg0);
    }
    /**
     * The meaning of the clef.
     * @returns {ClefType}
     */
    get clef_type() {
        const ret = wasm.__wbg_get_clef_clef_type(this.__wbg_ptr);
        return ret;
    }
    /**
     * The meaning of the clef.
     * @param {ClefType} arg0
     */
    set clef_type(arg0) {
        wasm.__wbg_set_clef_clef_type(this.__wbg_ptr, arg0);
    }
    /**
     * Creates a new clef with the given type and optional symbol.
     *
     * If the `symbol` parameter is `None`, the most common symbol for the
     * given `clef_type` will be used instead.
     * @param {ClefType} clef_type
     * @param {ClefSymbol | undefined} [symbol]
     * @returns {Clef}
     */
    static new(clef_type, symbol) {
        const ret = wasm.clef_new(clef_type, isLikeNone(symbol) ? 3 : symbol);
        return Clef.__wrap(ret);
    }
}

const DurationFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_duration_free(ptr >>> 0, 1));

export class Duration {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Duration.prototype);
        obj.__wbg_ptr = ptr;
        DurationFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DurationFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_duration_free(ptr, 0);
    }
    /**
     * @returns {DurationType}
     */
    get value() {
        const ret = wasm.__wbg_get_duration_value(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {DurationType} arg0
     */
    set value(arg0) {
        wasm.__wbg_set_duration_value(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get dots() {
        const ret = wasm.__wbg_get_duration_dots(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set dots(arg0) {
        wasm.__wbg_set_duration_dots(this.__wbg_ptr, arg0);
    }
    /**
     * @param {DurationType} value
     * @param {number} dots
     * @returns {Duration}
     */
    static new(value, dots) {
        const ret = wasm.duration_new(value, dots);
        return Duration.__wrap(ret);
    }
    /**
     * @param {Duration} beat_base_value
     * @param {number} beats
     * @returns {Duration}
     */
    static from_beats(beat_base_value, beats) {
        _assertClass(beat_base_value, Duration);
        const ret = wasm.duration_from_beats(beat_base_value.__wbg_ptr, beats);
        return Duration.__wrap(ret);
    }
    /**
     * @param {Tempo} tempo
     * @param {number} duration
     * @returns {Duration}
     */
    static from_duration(tempo, duration) {
        _assertClass(tempo, Tempo);
        const ret = wasm.duration_from_duration(tempo.__wbg_ptr, duration);
        return Duration.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    value() {
        const ret = wasm.duration_value(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} base_beat_value
     * @returns {number}
     */
    beats(base_beat_value) {
        const ret = wasm.duration_beats(this.__wbg_ptr, base_beat_value);
        return ret;
    }
    /**
     * @param {number} times
     * @returns {Duration}
     */
    split(times) {
        const ret = wasm.duration_split(this.__wbg_ptr, times);
        return Duration.__wrap(ret);
    }
}

const KeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_key_free(ptr >>> 0, 1));
/**
 * Represents the key of a musical piece, including both its
 * mode (i.e., major or minor) and its signature.
 */
export class Key {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Key.prototype);
        obj.__wbg_ptr = ptr;
        KeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_key_free(ptr, 0);
    }
    /**
     * The mode of the key (i.e., major or minor).
     * @returns {KeyMode}
     */
    get mode() {
        const ret = wasm.__wbg_get_key_mode(this.__wbg_ptr);
        return ret;
    }
    /**
     * The mode of the key (i.e., major or minor).
     * @param {KeyMode} arg0
     */
    set mode(arg0) {
        wasm.__wbg_set_key_mode(this.__wbg_ptr, arg0);
    }
    /**
     * The signature of the key (i.e., A, A♭, B, etc).
     * @returns {KeySignature}
     */
    get signature() {
        const ret = wasm.__wbg_get_key_signature(this.__wbg_ptr);
        return ret;
    }
    /**
     * The signature of the key (i.e., A, A♭, B, etc).
     * @param {KeySignature} arg0
     */
    set signature(arg0) {
        wasm.__wbg_set_key_signature(this.__wbg_ptr, arg0);
    }
    /**
     * Creates a new key with the given signature and mode.
     * @param {KeySignature} signature
     * @param {KeyMode} mode
     * @returns {Key}
     */
    static new(signature, mode) {
        const ret = wasm.key_new(signature, mode);
        return Key.__wrap(ret);
    }
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
    static from_fifths(fifths, mode) {
        const ret = wasm.key_from_fifths(fifths, isLikeNone(mode) ? 2 : mode);
        return Key.__wrap(ret);
    }
    /**
     * Returns the circle of fifths value for the key.
     *
     * The circle of fifths represents the number of flats or sharps in
     * a traditional key signature. Negative numbers are used for flats
     * and positive numbers for sharps. For example, a key with two flats
     * would be represented by a `fifths` value of `-2`.
     * @returns {number}
     */
    fifths() {
        const ret = wasm.key_fifths(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns a new key with the same tonic as the current key,
     * but with the opposite mode (i.e., the parallel key of C-Major
     * would be C-Minor and vice versa).
     * @returns {Key}
     */
    to_parallel() {
        const ret = wasm.key_to_parallel(this.__wbg_ptr);
        return Key.__wrap(ret);
    }
    /**
     * Returns a new key with the same accidentals as the current key,
     * but with the opposite mode (i.e., the relative key of C-Major
     * would be A-Minor and vice versa).
     * @returns {Key}
     */
    to_relative() {
        const ret = wasm.key_to_relative(this.__wbg_ptr);
        return Key.__wrap(ret);
    }
    /**
     * Converts the current key into its parallel key.
     *
     * A parallel key is a key with the same tonic as the current key,
     * but with the opposite mode (i.e., the parallel key of C-Major
     * would be C-Minor and vice versa).
     */
    make_parallel() {
        wasm.key_make_parallel(this.__wbg_ptr);
    }
    /**
     * Converts the current key into its relative key.
     *
     * A relative key is a key with the same accidentals as the current
     * key, but with the opposite mode (i.e., the relative key of C-Major
     * would be A-Minor and vice versa).
     */
    make_relative() {
        wasm.key_make_relative(this.__wbg_ptr);
    }
}

const PitchFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pitch_free(ptr >>> 0, 1));

export class Pitch {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Pitch.prototype);
        obj.__wbg_ptr = ptr;
        PitchFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PitchFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pitch_free(ptr, 0);
    }
    /**
     * @returns {PitchName}
     */
    get name() {
        const ret = wasm.__wbg_get_pitch_name(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {PitchName} arg0
     */
    set name(arg0) {
        wasm.__wbg_set_pitch_name(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get octave() {
        const ret = wasm.__wbg_get_pitch_octave(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set octave(arg0) {
        wasm.__wbg_set_pitch_octave(this.__wbg_ptr, arg0);
    }
    /**
     * @param {PitchName} name
     * @param {number} octave
     * @returns {Pitch}
     */
    static new(name, octave) {
        const ret = wasm.pitch_new(name, octave);
        return Pitch.__wrap(ret);
    }
    /**
     * @returns {Pitch}
     */
    static new_rest() {
        const ret = wasm.pitch_new_rest();
        return Pitch.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    is_rest() {
        const ret = wasm.pitch_is_rest(this.__wbg_ptr);
        return ret !== 0;
    }
}

const TempoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tempo_free(ptr >>> 0, 1));
/**
 * Represents an explicit tempo marking in music notation.
 */
export class Tempo {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Tempo.prototype);
        obj.__wbg_ptr = ptr;
        TempoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TempoFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tempo_free(ptr, 0);
    }
    /**
     * The base note which represents a "beat" in the tempo.
     * @returns {Duration}
     */
    get base_note() {
        const ret = wasm.__wbg_get_tempo_base_note(this.__wbg_ptr);
        return Duration.__wrap(ret);
    }
    /**
     * The base note which represents a "beat" in the tempo.
     * @param {Duration} arg0
     */
    set base_note(arg0) {
        _assertClass(arg0, Duration);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_tempo_base_note(this.__wbg_ptr, ptr0);
    }
    /**
     * The number of beats per minute.
     * @returns {number}
     */
    get beats_per_minute() {
        const ret = wasm.__wbg_get_tempo_beats_per_minute(this.__wbg_ptr);
        return ret;
    }
    /**
     * The number of beats per minute.
     * @param {number} arg0
     */
    set beats_per_minute(arg0) {
        wasm.__wbg_set_tempo_beats_per_minute(this.__wbg_ptr, arg0);
    }
    /**
     * Creates a new tempo with the given base note and beats per minute.
     * @param {Duration} base_note
     * @param {number} beats_per_minute
     * @returns {Tempo}
     */
    static new(base_note, beats_per_minute) {
        _assertClass(base_note, Duration);
        var ptr0 = base_note.__destroy_into_raw();
        const ret = wasm.tempo_new(ptr0, beats_per_minute);
        return Tempo.__wrap(ret);
    }
}

const TempoSuggestionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_temposuggestion_free(ptr >>> 0, 1));
/**
 * Represents a text-based tempo suggestion in music notation.
 */
export class TempoSuggestion {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TempoSuggestion.prototype);
        obj.__wbg_ptr = ptr;
        TempoSuggestionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TempoSuggestionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_temposuggestion_free(ptr, 0);
    }
    /**
     * @returns {TempoMarking}
     */
    get marking() {
        const ret = wasm.__wbg_get_temposuggestion_marking(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {TempoMarking} arg0
     */
    set marking(arg0) {
        wasm.__wbg_set_temposuggestion_marking(this.__wbg_ptr, arg0);
    }
    /**
     * Creates a new tempo suggestion with the given marking.
     * @param {TempoMarking} marking
     * @returns {TempoSuggestion}
     */
    static new(marking) {
        const ret = wasm.temposuggestion_new(marking);
        return TempoSuggestion.__wrap(ret);
    }
    /**
     * Returns a description of the tempo suggestion.
     * @returns {string}
     */
    description() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.temposuggestion_description(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Returns the minimum beats per minute for the tempo suggestion.
     * @returns {number}
     */
    bpm_min() {
        const ret = wasm.temposuggestion_bpm_min(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the maximum beats per minute for the tempo suggestion.
     * @returns {number}
     */
    bpm_max() {
        const ret = wasm.temposuggestion_bpm_max(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the average beats per minute for the tempo suggestion.
     * @returns {number}
     */
    value() {
        const ret = wasm.temposuggestion_value(this.__wbg_ptr);
        return ret;
    }
}

const TimeSignatureFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_timesignature_free(ptr >>> 0, 1));
/**
 * Represents a time signature in music notation.
 *
 * Some `signature` types are implicit (e.g., `CommonTime` = `4/4`,
 * `CutTime` = `2/2`), while others require an explicit `numerator` and `denominator`.
 */
export class TimeSignature {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TimeSignature.prototype);
        obj.__wbg_ptr = ptr;
        TimeSignatureFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TimeSignatureFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_timesignature_free(ptr, 0);
    }
    /**
     * The type of time signature marking, whether explicit or implicit.
     * @returns {TimeSignatureType}
     */
    get signature() {
        const ret = wasm.__wbg_get_timesignature_signature(this.__wbg_ptr);
        return ret;
    }
    /**
     * The type of time signature marking, whether explicit or implicit.
     * @param {TimeSignatureType} arg0
     */
    set signature(arg0) {
        wasm.__wbg_set_timesignature_signature(this.__wbg_ptr, arg0);
    }
    /**
     * The number of beats in each measure.
     * @returns {number}
     */
    get numerator() {
        const ret = wasm.__wbg_get_pitch_octave(this.__wbg_ptr);
        return ret;
    }
    /**
     * The number of beats in each measure.
     * @param {number} arg0
     */
    set numerator(arg0) {
        wasm.__wbg_set_pitch_octave(this.__wbg_ptr, arg0);
    }
    /**
     * The note value which represents a beat in the measure (e.g.,
     * `4` = quarter note, `8` = eighth note, etc.).
     * @returns {number}
     */
    get denominator() {
        const ret = wasm.__wbg_get_timesignature_denominator(this.__wbg_ptr);
        return ret;
    }
    /**
     * The note value which represents a beat in the measure (e.g.,
     * `4` = quarter note, `8` = eighth note, etc.).
     * @param {number} arg0
     */
    set denominator(arg0) {
        wasm.__wbg_set_timesignature_denominator(this.__wbg_ptr, arg0);
    }
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
    static new(signature) {
        const ret = wasm.timesignature_new(signature);
        return TimeSignature.__wrap(ret);
    }
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
    static new_explicit(numerator, denominator) {
        const ret = wasm.timesignature_new_explicit(numerator, denominator);
        return TimeSignature.__wrap(ret);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('amm_sdk_netsblox_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
