/**
 * VOICE MODULE FOR HMI SYSTEM
 * Obsługa TTS (Text-to-Speech) i STT (Speech-to-Text)
 * Integracja z gestami dla multi-modalnego interfejsu
 */

// ===========================
// 1. VOICE RECOGNITION (STT)
// ===========================
class VoiceRecognition {
    constructor(options = {}) {
        this.options = {
            language: 'pl-PL', // Domyślnie polski
            continuous: true,
            interimResults: true,
            maxAlternatives: 3,
            ...options
        };
        
        this.recognition = null;
        this.isListening = false;
        this.callbacks = new Map();
        this.commands = new Map();
        
        this.initializeRecognition();
    }

    initializeRecognition() {
        // Sprawdź wsparcie przeglądarki
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('❌ Speech Recognition not supported in this browser');
            this.supported = false;
            return;
        }
        
        this.supported = true;
        this.recognition = new SpeechRecognition();
        
        // Konfiguracja
        this.recognition.lang = this.options.language;
        this.recognition.continuous = this.options.continuous;
        this.recognition.interimResults = this.options.interimResults;
        this.recognition.maxAlternatives = this.options.maxAlternatives;
        
        // Event handlery
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.emit('start');
            console.log('🎤 Voice recognition started');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.emit('end');
            console.log('🎤 Voice recognition ended');
            
            // Auto-restart jeśli continuous
            if (this.options.continuous && this.shouldRestart) {
                setTimeout(() => this.start(), 100);
            }
        };

        this.recognition.onresult = (event) => {
            const results = event.results;
            const lastResult = results[results.length - 1];
            
            const transcript = lastResult[0].transcript;
            const confidence = lastResult[0].confidence;
            const isFinal = lastResult.isFinal;
            
            const data = {
                transcript,
                confidence,
                isFinal,
                alternatives: Array.from(lastResult).map(alt => ({
                    transcript: alt.transcript,
                    confidence: alt.confidence
                }))
            };
            
            // Emituj zdarzenie
            this.emit('result', data);
            
            // Sprawdź komendy jeśli finalne
            if (isFinal) {
                this.checkCommands(transcript);
            }
            
            console.log(`🗣️ ${isFinal ? 'Final' : 'Interim'}: "${transcript}" (${(confidence * 100).toFixed(1)}%)`);
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Voice recognition error:', event.error);
            this.emit('error', event.error);
            
            // Niektóre błędy wymagają restartu
            if (['network', 'no-speech'].includes(event.error)) {
                this.restart();
            }
        };

        this.recognition.onnomatch = () => {
            console.log('❓ No speech match');
            this.emit('nomatch');
        };
    }

    // Zarządzanie komendami
    registerCommand(pattern, callback, options = {}) {
        const command = {
            pattern: pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i'),
            callback,
            exact: options.exact || false,
            priority: options.priority || 0
        };
        
        const id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.commands.set(id, command);
        
        return id;
    }

    unregisterCommand(id) {
        return this.commands.delete(id);
    }

    checkCommands(transcript) {
        const normalizedTranscript = transcript.toLowerCase().trim();
        
        // Sortuj komendy według priorytetu
        const sortedCommands = Array.from(this.commands.values())
            .sort((a, b) => b.priority - a.priority);
        
        for (const command of sortedCommands) {
            let match = false;
            let matchData = null;
            
            if (command.exact) {
                match = normalizedTranscript === command.pattern.source.toLowerCase();
            } else {
                const result = command.pattern.exec(normalizedTranscript);
                if (result) {
                    match = true;
                    matchData = result;
                }
            }
            
            if (match) {
                command.callback({
                    transcript,
                    normalizedTranscript,
                    matchData,
                    command: command.pattern.source
                });
                
                this.emit('command', {
                    transcript,
                    command: command.pattern.source
                });
                
                // Zatrzymaj po pierwszym dopasowaniu
                break;
            }
        }
    }

    // Kontrola
    start() {
        if (!this.supported) {
            console.warn('Speech Recognition not supported');
            return false;
        }
        
        if (this.isListening) {
            console.log('Already listening');
            return true;
        }
        
        this.shouldRestart = true;
        this.recognition.start();
        return true;
    }

    stop() {
        if (!this.isListening) return;
        
        this.shouldRestart = false;
        this.recognition.stop();
    }

    restart() {
        this.stop();
        setTimeout(() => this.start(), 100);
    }

    // Event system
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    emit(event, data) {
        const callbacks = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    // Ustawienia
    setLanguage(language) {
        this.options.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
            if (this.isListening) {
                this.restart();
            }
        }
    }

    // Debugowanie
    getDebugInfo() {
        return {
            supported: this.supported,
            isListening: this.isListening,
            language: this.options.language,
            commandsCount: this.commands.size,
            continuous: this.options.continuous
        };
    }
}

// ===========================
// 2. VOICE SYNTHESIS (TTS)
// ===========================
class VoiceSynthesis {
    constructor(options = {}) {
        this.options = {
            language: 'pl-PL',
            rate: 1.0,      // Prędkość mówienia (0.1 - 10)
            pitch: 1.0,     // Wysokość głosu (0 - 2)
            volume: 1.0,    // Głośność (0 - 1)
            voice: null,    // Konkretny głos
            ...options
        };
        
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.queue = [];
        this.isSpeaking = false;
        this.callbacks = new Map();
        
        this.initialize();
    }

    initialize() {
        if (!this.synthesis) {
            console.warn('❌ Speech Synthesis not supported');
            this.supported = false;
            return;
        }
        
        this.supported = true;
        
        // Załaduj głosy
        this.loadVoices();
        
        // Niektóre przeglądarki ładują głosy asynchronicznie
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // Znajdź preferowany głos
        if (this.options.voice === null && this.voices.length > 0) {
            // Szukaj głosu dla wybranego języka
            const preferredVoice = this.voices.find(voice => 
                voice.lang.startsWith(this.options.language.split('-')[0])
            );
            
            if (preferredVoice) {
                this.options.voice = preferredVoice;
            } else {
                this.options.voice = this.voices[0];
            }
        }
        
        console.log(`🔊 Loaded ${this.voices.length} voices`);
        this.emit('voicesloaded', this.voices);
    }

    // Mówienie
    speak(text, options = {}) {
        if (!this.supported) {
            console.warn('Speech Synthesis not supported');
            return Promise.reject(new Error('Not supported'));
        }
        
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Ustawienia
            const config = { ...this.options, ...options };
            utterance.lang = config.language;
            utterance.rate = config.rate;
            utterance.pitch = config.pitch;
            utterance.volume = config.volume;
            
            if (config.voice) {
                utterance.voice = config.voice;
            }
            
            // Event handlery
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.emit('start', { text });
                console.log(`🔊 Speaking: "${text}"`);
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.emit('end', { text });
                resolve();
                
                // Sprawdź kolejkę
                this.processQueue();
            };
            
            utterance.onerror = (event) => {
                this.isSpeaking = false;
                console.error('❌ Speech synthesis error:', event);
                this.emit('error', event);
                reject(event);
            };
            
            utterance.onpause = () => this.emit('pause');
            utterance.onresume = () => this.emit('resume');
            
            // Dodaj do kolejki lub mów od razu
            if (options.queue && this.isSpeaking) {
                this.queue.push(utterance);
            } else {
                // Anuluj obecne jeśli trzeba
                if (this.isSpeaking && !options.queue) {
                    this.synthesis.cancel();
                }
                this.synthesis.speak(utterance);
            }
        });
    }

    // Kolejkowanie
    processQueue() {
        if (this.queue.length > 0 && !this.isSpeaking) {
            const nextUtterance = this.queue.shift();
            this.synthesis.speak(nextUtterance);
        }
    }

    // Kontrola
    pause() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.pause();
        }
    }

    resume() {
        if (this.synthesis) {
            this.synthesis.resume();
        }
    }

    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.queue = [];
            this.isSpeaking = false;
        }
    }

    // Pomocnicze funkcje
    speakWithHighlight(text, highlightCallback) {
        const words = text.split(' ');
        let currentWord = 0;
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                highlightCallback(currentWord, words[currentWord]);
                currentWord++;
            }
        };
        
        return this.speak(text);
    }

    // Ustawienia głosu
    setVoice(voiceNameOrIndex) {
        if (typeof voiceNameOrIndex === 'number') {
            this.options.voice = this.voices[voiceNameOrIndex];
        } else {
            this.options.voice = this.voices.find(v => 
                v.name === voiceNameOrIndex || 
                v.lang === voiceNameOrIndex
            );
        }
    }

    getVoices(language = null) {
        if (language) {
            return this.voices.filter(v => v.lang.startsWith(language));
        }
        return this.voices;
    }

    // Event system
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    emit(event, data) {
        const callbacks = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    // Debug
    getDebugInfo() {
        return {
            supported: this.supported,
            isSpeaking: this.isSpeaking,
            voicesCount: this.voices.length,
            currentVoice: this.options.voice?.name,
            queueLength: this.queue.length,
            settings: {
                rate: this.options.rate,
                pitch: this.options.pitch,
                volume: this.options.volume
            }
        };
    }
}

// ===========================
// 3. VOICE HMI INTEGRATION
// ===========================
class VoiceHMI {
    constructor(hmiManager, options = {}) {
        this.hmi = hmiManager;
        this.options = {
            language: 'pl-PL',
            voiceCommands: true,
            voiceFeedback: true,
            gestureVoiceSync: true,
            ...options
        };
        
        this.stt = new VoiceRecognition({
            language: this.options.language
        });
        
        this.tts = new VoiceSynthesis({
            language: this.options.language
        });
        
        this.voiceGestures = new Map();
        
        if (this.options.voiceCommands) {
            this.setupVoiceCommands();
        }
        
        if (this.options.gestureVoiceSync) {
            this.setupGestureVoiceSync();
        }
    }

    // Rejestracja gestów głosowych
    gesture(name) {
        const self = this;
        const config = {
            name,
            voicePattern: null,
            gestureType: null,
            callbacks: []
        };

        const builder = {
            voice(pattern, options = {}) {
                config.voicePattern = pattern;
                
                // Rejestruj komendę głosową
                const commandId = self.stt.registerCommand(pattern, (data) => {
                    self.executeVoiceGesture(name, data);
                }, options);
                
                config.commandId = commandId;
                return builder;
            },
            
            withGesture(gestureType, gestureOptions = {}) {
                config.gestureType = gestureType;
                config.gestureOptions = gestureOptions;
                
                // Rejestruj również gest
                self.hmi.gesture(`${name}_gesture`)
                    [gestureType](gestureOptions)
                    .on((result) => {
                        self.executeVoiceGesture(name, { 
                            gesture: true, 
                            result 
                        });
                    });
                
                return builder;
            },
            
            on(callback) {
                config.callbacks.push(callback);
                self.voiceGestures.set(name, config);
                return builder;
            },
            
            speak(response) {
                config.response = response;
                return builder;
            }
        };

        return builder;
    }

    executeVoiceGesture(name, data) {
        const config = this.voiceGestures.get(name);
        if (!config) return;
        
        // Wykonaj callbacki
        config.callbacks.forEach(callback => callback(data));
        
        // Odpowiedź głosowa
        if (config.response && this.options.voiceFeedback) {
            const response = typeof config.response === 'function' 
                ? config.response(data) 
                : config.response;
            
            this.tts.speak(response);
        }
        
        console.log(`🎤 Voice gesture executed: ${name}`, data);
    }

    // Podstawowe komendy głosowe
    setupVoiceCommands() {
        // Nawigacja
        this.gesture('voice_next')
            .voice(/następn[ya]|dalej|next/i)
            .on(() => {
                console.log('▶️ Next command');
                this.hmi.emit('navigation', { direction: 'next' });
            })
            .speak('Przechodzę dalej');

        this.gesture('voice_previous')
            .voice(/poprzedni[a]?|wstecz|cofnij|back/i)
            .on(() => {
                console.log('◀️ Previous command');
                this.hmi.emit('navigation', { direction: 'previous' });
            })
            .speak('Wracam');

        // Akcje
        this.gesture('voice_delete')
            .voice(/usuń|skasuj|wymaż|delete/i)
            .withGesture('circle', { minRadius: 40 })
            .on((data) => {
                console.log('🗑️ Delete command');
                this.hmi.emit('delete', data);
            })
            .speak('Usuwam zaznaczone elementy');

        this.gesture('voice_save')
            .voice(/zapisz|zachowaj|save/i)
            .on(() => {
                console.log('💾 Save command');
                this.hmi.emit('save');
            })
            .speak('Zapisuję');

        // Pomoc
        this.gesture('voice_help')
            .voice(/pomoc|help|co mogę/i)
            .on(() => {
                this.showVoiceHelp();
            });
    }

    // Synchronizacja gestów z głosem
    setupGestureVoiceSync() {
        // Feedback głosowy dla gestów
        if (this.hmi.detector) {
            this.hmi.detector.on('gesture', (data) => {
                if (this.options.voiceFeedback) {
                    this.provideGestureFeedback(data);
                }
            });
        }
    }

    provideGestureFeedback(gestureData) {
        const feedbackMap = {
            'delete_circle': 'Usuwam elementy w zaznaczonym obszarze',
            'navigate_swipe': 'Zmieniam stronę',
            'select_tap': 'Wybieram element',
            'zoom_pinch': 'Zmieniam powiększenie'
        };
        
        const feedback = feedbackMap[gestureData.name];
        if (feedback) {
            this.tts.speak(feedback, { volume: 0.5 });
        }
    }

    // Pomocnicze funkcje
    showVoiceHelp() {
        const commands = Array.from(this.voiceGestures.values())
            .map(g => g.voicePattern?.source || 'brak wzorca')
            .filter(p => p !== 'brak wzorca');
        
        const helpText = `Dostępne komendy głosowe: ${commands.join(', ')}`;
        this.tts.speak(helpText);
    }

    // Kontrola
    start() {
        if (this.options.voiceCommands) {
            this.stt.start();
        }
        console.log('🎙️ Voice HMI started');
    }

    stop() {
        this.stt.stop();
        this.tts.stop();
        console.log('🎙️ Voice HMI stopped');
    }

    // Multi-modal gestures
    multiModalGesture(name) {
        const self = this;
        const config = {
            name,
            conditions: [],
            actions: []
        };

        const builder = {
            whenSaying(pattern) {
                config.voiceCondition = pattern;
                return builder;
            },
            
            whileGesturing(gestureType, options) {
                config.gestureCondition = { type: gestureType, options };
                return builder;
            },
            
            then(callback) {
                // Złożona logika multi-modalna
                const multiModalHandler = () => {
                    let voiceActive = false;
                    let gestureActive = false;
                    
                    // Monitoruj głos
                    if (config.voiceCondition) {
                        self.stt.registerCommand(config.voiceCondition, () => {
                            voiceActive = true;
                            checkMultiModal();
                        });
                    }
                    
                    // Monitoruj gest
                    if (config.gestureCondition) {
                        self.hmi.gesture(`${name}_mm_gesture`)
                            [config.gestureCondition.type](config.gestureCondition.options)
                            .on(() => {
                                gestureActive = true;
                                checkMultiModal();
                            });
                    }
                    
                    // Sprawdź czy oba warunki spełnione
                    const checkMultiModal = () => {
                        if ((!config.voiceCondition || voiceActive) && 
                            (!config.gestureCondition || gestureActive)) {
                            callback({
                                voice: voiceActive,
                                gesture: gestureActive,
                                multiModal: true
                            });
                            
                            // Reset
                            voiceActive = false;
                            gestureActive = false;
                        }
                    };
                };
                
                multiModalHandler();
                return builder;
            }
        };

        return builder;
    }

    // Debug
    getDebugInfo() {
        return {
            stt: this.stt.getDebugInfo(),
            tts: this.tts.getDebugInfo(),
            voiceGestures: Array.from(this.voiceGestures.keys()),
            options: this.options
        };
    }
}

// ===========================
// 4. PRZYKŁAD UŻYCIA
// ===========================
/*
// Import podstawowego HMI
import { HMIManager } from './simple-hmi-system.js';

// Inicjalizacja z głosem
const hmi = new HMIManager({ debug: true });
const voiceHMI = new VoiceHMI(hmi, {
    language: 'pl-PL',
    voiceFeedback: true
});

// Rejestracja komend głosowych
voiceHMI.gesture('voice_create')
    .voice(/stwórz|utwórz|dodaj|create/i)
    .on(() => {
        createNewComponent();
    })
    .speak('Tworzę nowy komponent');

// Multi-modal: głos + gest
voiceHMI.multiModalGesture('enhanced_delete')
    .whenSaying(/usuń wszystko|delete all/i)
    .whileGesturing('circle', { minRadius: 60 })
    .then(() => {
        deleteAllInArea();
        voiceHMI.tts.speak('Usunięto wszystkie elementy w zaznaczonym obszarze');
    });

// Start
hmi.start();
voiceHMI.start();

// Test TTS
voiceHMI.tts.speak('System HMI z obsługą głosu jest gotowy');

// Test STT
voiceHMI.stt.on('result', (data) => {
    console.log('Rozpoznano:', data.transcript);
});
*/

// Export
export { VoiceRecognition, VoiceSynthesis, VoiceHMI };