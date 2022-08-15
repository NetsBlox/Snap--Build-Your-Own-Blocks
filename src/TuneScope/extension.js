(function () {
    function setInstrument(name) {
        window.parent.currentInstrumentName = name.toLowerCase();
    }
    function setVolume(percent) {
        window.parent.globalInstrumentVolume = percent / 100;
    }
    function setInstrumentVolume(name, percent) {
        window.parent.instrumentVolumes[name] = percent / 100;
    }
    function playNote(note, duration) {
        window.playNote(note, duration);
    }
    function playTracks(tracksList, timeSignature, tempo) {
        const multiplyArray = (arr, length) => Array.from({ length }, () => arr).flat()

        const playTrackMeasure = async (currTrack, measureIndex, beatsPerMeasure, tempo, instrument) => {
            let beat = 0;
            const beatEndIndex = beatsPerMeasure[0];

            while (beat < beatEndIndex) {
                const note = currTrack[measureIndex][0];
                const noteLength = currTrack[measureIndex][1];
                measureIndex++; //increment for the next index in the track

                const durationInSeconds = noteLength * (window.baseTempo / tempo);

                // play the note and wait
                await window.playNote(note, durationInSeconds, instrument);
                await wait(durationInSeconds)

                // we increment i with respect to the number of beats the current note occupies in a measure
                beat += noteLength * beatsPerMeasure[1];
            }
        }

        const playTracks = async (tracksList, timeSignature, tempo) => {
            // verify inputs
            if (!tracksList.contents) return;

            const beatsPerMeasure = window.timeSignatureToBeatsPerMeasure[timeSignature];

            let tracks = window.convertListToArrayRecursive(tracksList);

            // convert all elements in the track to lowercase
            tracks = window.toLowerCaseRecursive(tracks);

            // check to make sure we have an actual melody/chord track rather than just a loop
            // this ensures that we have a definitive track length
            let haveSetTrackLength = false
            let definitiveTrackIndex = 0 //index of valid melody/chord track

            // check to make sure we have an actual melody/chord track rather than just a loop
            // this ensures that we have a definitive track length
            for (let i = 0; i < tracks.length; i++) {
                let currTrack = tracks[i];
                if (currTrack[0][0] === 'melody' || currTrack[0][0] === 'chords') {
                    definitiveTrackIndex = i;
                    haveSetTrackLength = true;
                    break;
                }
            }

            if (!haveSetTrackLength) {
                console.error('No Melody or Chord track provided, only Chord/Drum Loop')
                return;
            }

            /*
                first, add up all the note values in the track
                to determine the total number of beats
                then, calculate the number of measures by considering the time signature
                and the total number of beats in the track list
            */

            // converts the strings of note length in each track to their respective duration values
            for (let i = 0; i < tracks.length; i++) {
                let currTrack = tracks[i];
                for (let j = 1; j < currTrack.length; j++) { //index from 1 to avoid the header
                    //Reassign the durations list to numerical duration values from strings
                    //jth (Note, Duration) pair
                    currTrack[j][1] = window.noteLengthToTimeValue[currTrack[j][1]]
                }
            }

            // properly encodes drum tracks
            for (let i = 0; i < tracks.length; i++) {
                let currTrack = tracks[i];
                // check each track's header to see whether it is a drum track
                // Header: (Instrument, Type)
                if (currTrack[0][0] === 'loop-drums') {
                    const isBassDrum = (currTrack[0][1] === 'bass drum');
                    for (let j = 1; j < currTrack.length; j++) {
                        if (currTrack[j][0] === 'x') { // ('x', duration) encode a note
                            //check if the instrument is a bass drum
                            if (isBassDrum) {
                                currTrack[j][0] = 'C2';
                            } else {
                                currTrack[j][0] = 'C4';
                            }
                        } else { //(' ', duration) encode a rest
                            currTrack[j][0] = 'R';
                        }

                        //converting the duration length to the appropriate value based on the time signature
                        // If eighth notes get the beat, subdivide drum tracks into sixteenth notes
                        if (beatsPerMeasure[1] == 0.5) {
                            currTrack[j][1] = 0.25;
                        }
                    }
                }
            }

            // calculates the total number of beats in the song
            let totalBeats = 0;
            let defTrack = tracks[definitiveTrackIndex];
            for (let j = 1; j < defTrack.length; j++) {
                totalBeats += parseFloat(defTrack[j][1]);
            }

            // length of measure = total number of beats (w.r.t which note gets the beat) / beats per measure
            const totalMeasures = (totalBeats) / (beatsPerMeasure[0] * beatsPerMeasure[1]);

            //convert any melody/chord/drum loop to a regular track
            // done by repeatedly appending the array to itself
            for (let i = 0; i < tracks.length; i++) {
                let currTrack = tracks[i];
                //check if the current track is a loop
                if (currTrack[0][0] === 'loop-melody' || currTrack[0][0] === 'loop-chords' || currTrack[0][0] === 'loop-drums') {
                    let beatsInLoop = 0;
                    for (let j = 1; j < currTrack.length; j++) {
                        beatsInLoop += parseFloat(currTrack[j][1]);
                    }
                    let loopCount = parseInt(totalBeats / beatsInLoop);

                    //appending the track to itself
                    //we don't repeat the header
                    let header = currTrack[0];
                    let newTrack = multiplyArray(currTrack.slice(1), loopCount);
                    newTrack.unshift(header)

                    if (header[0] === 'loop-chords') {
                        newTrack[0][0] = 'chords';
                    } else {
                        newTrack[0][0] = 'melody';
                    }

                    //push the multiplied track to the tracks list
                    //and remove the original loop
                    tracks.push(newTrack)
                    tracks.splice(i,1)
                    i--;
                }
            }

            for (let i = 0; i < tracks.length; i++) {
                let currTrack = tracks[i];
                //find which elements of the track list are embedded chords
                if (currTrack[0][0] === 'chords') {
                    let chordInstrument = currTrack[0][1];
                    let maxChordLen = 0;
                    for (let j = 1; j < currTrack.length; j++) {
                        // iterate through each chord in the track to find the largest chord (most # of notes)
                        maxChordLen = Math.max(maxChordLen, currTrack[j][0].length);
                    }

                    //splits the notes of chords into separate tracks
                    for(let k = 0; k < maxChordLen; k++) {
                        // the new track will have the same instrument, but be encoded as a melody line
                        let newTrack = [['melody', chordInstrument]];
                        for (let j = 1; j < currTrack.length; j++) {
                            let currChord = currTrack[j][0];
                            // if the chord is large enough, add the kth note of the chord to the melody line
                            //otherwise, the melody will rest for that note in the track
                            if (k < currChord.length) {
                                // kth note of the chord, keep the duration of the chord
                                newTrack.push([currChord[k], currTrack[j][1]]);
                            }else {
                                newTrack.push(['r', currTrack[j][1]]);

                            }
                        }
                        //add this new track to the overarching track list
                        tracks.push(newTrack);
                    }
                    // delete original chord track from tracks
                    tracks.splice(i, 1);
                    i--;
                }
            }

            // Play Measures track by track
            for (let i = 0; i < totalMeasures; i++) {
                console.log(`Playing measure ${i + 1}`);
                const measureResults = [];

                // count for the number of beats that have passed since the last measure
                // e.g. in 4/4, measure 3 will have 2*4 = 8 beats elapsed. Next measure starts
                // on beat 8 (0 indexed)
                let elapsedBeats = i * beatsPerMeasure[0];

                //per track
                for (let j = 0; j < tracks.length; j++) {
                    let currTrack = tracks[j];
                    let instrument = currTrack[0][1];
                    let measureIndex = 0;
                    let elapsedSum = 0;

                    // identifying where in the track array to begin the measure
                    // since different tracks have different array lengths, but
                    // the same amount of beats, they will align at each measure
                    // beat-wise, but have different starting indices measure-wise
                    for (let k = 1; k < currTrack.length; k++) {
                        if (elapsedSum >= elapsedBeats) {
                            measureIndex = k;
                            break;
                        } else {
                            // add the value of the kth duration
                            elapsedSum += parseFloat(currTrack[k][1]);
                        }
                    }

                    measureResults.push(new Promise((resolve, reject) => {
                        playTrackMeasure(currTrack, measureIndex, beatsPerMeasure, tempo, instrument).then(resolve).catch(reject)
                    }));
                }
                await Promise.all(measureResults);
            }
        }

        playTracks(tracksList, timeSignature, tempo);
    }
    function playMidi(controller_name, instrument) {
        let current_controller = controller_name;
        let midi_instrument = instrument;

        function onEnabled() {
            let synth = window.WebMidi.getInputByName(current_controller);
            let keyboard = synth.channels[1];

            // Listener for the keyboard, prints midi note number
            keyboard.addListener('noteon', e => {
                window.playNote(e.note.identifier, 0.5, midi_instrument);
            });
        }

        const playMidiController = async (controller, instrument) => {
            if(controller === null || controller === '') return;
            current_controller = controller;

            // enables the webmidi controller, doesn't record notes
            window.WebMidi.enable((err) => {
                if (err) { alert(err); } else { onEnabled(); }
            });
        }

        playMidiController(controller_name, instrument);
    }
    function setTone(id, freq, ampl) {
        let created = false;
        if (!window.tones[id]) {
            window.tones[id] = new window.Tone(id);
            created = true;
        }

        window.tones[id].setFreq(freq);
        window.tones[id].setAmpl(ampl * 100);
        if (!created) window.tones[id].turnOn();
    }
    function turnToneOn(id, on) {
        const tone = window.tones[id];
        if (!tone) return;
        if (on) { tone.turnOn(); } else { tone.turnOff(); }
    }
    function stopTones() {
        for (const tone of Object.values(window.tones)) {
            tone.turnOff();
        }
    }

    // ----------------------------------------------------------------------

    async function wait(duration) {
        return new Promise(resolve => {
            setTimeout(resolve, duration * 1000);
        })
    }

    const DURATION_MAP = {
        'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25, 'thirtysecond': 0.125,
        'dotted whole': 6, 'dotted half': 3, 'dotted quarter': 1.5, 'dotted eighth': 0.75, 'dotted sixteenth': 0.375, 'dotted thirtysecond': 0.1875,
        'whole triplet': 8/3, 'half triplet': 4/3, 'quarter triplet': 2/3, 'eighth triplet': 1/3, 'sixteenth triplet': 0.5/3, 'thirtysecond triplet': 0.25/3,
    };
    function getTempo(ide) {
        const res = ide.stage.tempo;
        return res;
    }
    function parseDuration(duration, ide) {
        duration = DURATION_MAP[duration.toLowerCase()] || +duration || 0;
        if (duration <= 0) duration = 1;
        return duration * (60 / getTempo(ide));
    }

    // ----------------------------------------------------------------------

    class TuneScope extends Extension {
        constructor(ide) {
            super('TuneScope');
            this.ide = ide;
        }

        onOpenRole() {}

        getMenu() { return {}; }

        getCategories() {
            return [
                new Extension.Category('music', new Color(195, 0, 204)),
            ];
        }

        getPalette() {
            const blocks = [
                new Extension.Palette.Block('tuneScopeSetInstrument'),
                new Extension.Palette.Block('tuneScopeSetVolume'),
                new Extension.Palette.Block('tuneScopeSetInstrumentVolume'),

                new Extension.Palette.Block('tuneScopePlayNoteForDuration'),
                new Extension.Palette.Block('tuneScopePlayChordForDuration'),

                new Extension.Palette.Block('tuneScopeInstrument'),
                new Extension.Palette.Block('tuneScopeNote'),
                new Extension.Palette.Block('tuneScopeDuration'),
            ];
            return [
                new Extension.PaletteCategory('music', blocks, SpriteMorph),
                new Extension.PaletteCategory('music', blocks, StageMorph),
            ];
        }

        getBlocks() {
            function block(name, type, category, spec, defaults, action) {
                return new Extension.Block(name, type, category, spec, defaults, action).for(SpriteMorph, StageMorph)
            }
            return [
                block('tuneScopeSetInstrument', 'command', 'music', 'set instrument to %tuneScopeInstrument', ['Piano'], setInstrument),
                block('tuneScopeSetVolume', 'command', 'music', 'set volume to %n %', ['50'], setVolume),
                block('tuneScopeSetInstrumentVolume', 'command', 'music', 'set instrument %tuneScopeInstrument volume to %n %', ['Piano', '50'], setInstrumentVolume),

                block('tuneScopePlayNoteForDuration', 'command', 'music', 'play note %tuneScopeNote for duration %tuneScopeDuration', ['C3', 'Quarter'], async (note, duration) => {
                    duration = parseDuration(duration, this.ide);
                    playNote(note, duration);
                    console.log('before wait');
                    await wait(duration); // TODO: fix this - doesn't pause process
                    console.log('after wait');
                }),
                block('tuneScopeRestForDuration', 'command', 'music', 'rest for duration %tuneScopeDuration', ['Quarter'], async duration => {
                    duration = parseDuration(duration, this.ide);
                    await wait(duration); // TODO: fix this - doesn't pause process
                }),
                block('tuneScopePlayChordForDuration', 'command', 'music', 'play chord %l for duration %tuneScopeDuration', [null, 'Quarter'], async (chord, duration) => {
                    duration = parseDuration(duration, this.ide);
                    chord = chord ? listToArray(chord) : [];
                    for (const note of chord) {
                        playNote(note, duration);
                    }
                    await wait(duration); // TODO: fix this - doesn't pause process
                }),

                block('tuneScopeInstrument', 'reporter', 'music', 'instrument %tuneScopeInstrument', ['Piano'], x => x),
                block('tuneScopeNote', 'reporter', 'music', 'note %tuneScopeNote', ['C3'], x => x),
                block('tuneScopeDuration', 'reporter', 'music', 'duration %tuneScopeDuration', ['Quarter'], x => x),
            ];
        }

        getLabelParts() {
            function identityMap(s) {
                const res = {};
                for (const x of s) res[x] = x;
                return res;
            }
            function unionMaps(maps) {
                const res = {};
                for (const map of maps) {
                    for (const key in map) res[key] = map[key];
                }
                return res;
            }
            return [
                new Extension.LabelPart('tuneScopeInstrument', () => new InputSlotMorph(
                    null, // text
                    false, // numeric
                    {
                        'Piano': 'Piano',
                        'Brass': identityMap(['French Horn', 'Trumpet', 'Tuba']),
                        'Strings': identityMap(['Banjo', 'Bass, Acoustic', 'Bass, Electric (Finger)', 'Cello', 'Guitar, Acoustic', 'Guitar, Electric', 'Harp', 'Koto', 'Sitar', 'Violin']),
                        'Woodwinds': identityMap(['Bassoon', 'Clarinet', 'Flute', 'Oboe', 'Saxophone', 'Shakuhachi']),
                        'Drums': identityMap(['Cabasa', 'Snare Drum', 'Bass Drum', 'Closed Hi-Hat', 'Open Hi-Hat', 'Mid Tom', 'High Tom', 'Crash Cymbal']),
                        'Other': identityMap(['Accordion', 'Marimba', 'Organ', 'Vibraphone']),
                    },
                    true, // readonly (no arbitrary text)
                )),
                new Extension.LabelPart('tuneScopeNote', () => new InputSlotMorph(
                    null, // text
                    false, // numeric
                    unionMaps([
                        identityMap(['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']),
                        { 'Sharps': identityMap(['C#3', 'D#3', 'E#3', 'F#3', 'G#3', 'A#3', 'B#3', 'C#4', 'D#4', 'E#4', 'F#4', 'G#4', 'A#4', 'B#4']) },
                        { 'Flats':  identityMap(['Cb3', 'Db3', 'Eb3', 'Fb3', 'Gb3', 'Ab3', 'Bb3', 'Cb4', 'Db4', 'Eb4', 'Fb4', 'Gb4', 'Ab4', 'Bb4']) },
                    ]),
                    false, // readonly (no arbitrary text)
                )),
                new Extension.LabelPart('tuneScopeDuration', () => new InputSlotMorph(
                    null, // text
                    false, // numeric
                    unionMaps([
                        identityMap(['Whole', 'Half', 'Quarter', 'Eighth', 'Sixteenth', 'Thirtysecond']),
                        { 'Dotted Notes': identityMap(['Dotted Half', 'Dotted Quarter', 'Dotted Eighth', 'Dotted Sixteenth']) },
                        { 'Triplet Notes':  identityMap(['Half Triplet', 'Quarter Triplet', 'Eighth Triplet', 'Sixteenth Triplet']) },
                    ]),
                    false, // readonly (no arbitrary text)
                )),
            ];
        }
    }

    const files = [
        'WebAudioFontPlayer.js',
        'webmidi.iife.js',
        '0020_JCLive_sf2_file.js',
        '0121_FluidR3_GM_sf2_file.js',
        '0180_Chaos_sf2_file.js',
        '0230_Aspirin_sf2_file.js',
        '0241_JCLive_sf2_file.js',
        '0260_JCLive_sf2_file.js',
        '0320_GeneralUserGS_sf2_file.js',
        '0350_JCLive_sf2_file.js',
        '0400_JCLive_sf2_file.js',
        '0420_JCLive_sf2_file.js',
        '0460_GeneralUserGS_sf2_file.js',
        '0560_GeneralUserGS_sf2_file.js',
        '0580_GeneralUserGS_sf2_file.js',
        '0600_GeneralUserGS_sf2_file.js',
        '0650_FluidR3_GM_sf2_file.js',
        '0680_JCLive_sf2_file.js',
        '0700_FluidR3_GM_sf2_file.js',
        '0710_Chaos_sf2_file.js',
        '0730_JCLive_sf2_file.js',
        '0770_SBLive_sf2.js',
        '1040_Aspirin_sf2_file.js',
        '1050_FluidR3_GM_sf2_file.js',
        '1070_FluidR3_GM_sf2_file.js',
        '12835_21_FluidR3_GM_sf2_file.js',
        '12840_6_JCLive_sf2_file.js',
        '12842_0_FluidR3_GM_sf2_file.js',
        '12846_0_FluidR3_GM_sf2_file.js',
        '12847_21_FluidR3_GM_sf2_file.js',
        '12848_21_FluidR3_GM_sf2_file.js',
        '12849_21_FluidR3_GM_sf2_file.js',
        '12869_6_JCLive_sf2_file.js',
        'TS_init.js',
    ];
    const devRoot = 'http://localhost:8080/src/TuneScope/';
    const releaseRoot = 'https://extensions.netsblox.org/extensions/TuneScope/js/';
    const root = window.origin.includes('localhost') ? devRoot : releaseRoot;
    for (const file of files) {
        const url = root + file;
        console.log(`TuneScope - loading src ${url}`);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = false;
        document.body.appendChild(script);
    }

    NetsBloxExtensions.register(TuneScope);
})();
