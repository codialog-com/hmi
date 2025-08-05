/**
 * PRZYKŁADY UŻYCIA VOICE HMI
 * Praktyczne przykłady integracji głosu z gestami
 */

import { HMIManager } from './simple-hmi-system.js';
import { VoiceHMI } from './voice-hmi-module.js';

// ===========================
// 1. PODSTAWOWA APLIKACJA Z GŁOSEM
// ===========================
class VoiceEnabledApp {
    constructor() {
        this.hmi = null;
        this.voiceHMI = null;
        this.components = [];
        this.selectedComponents = [];
    }

    async init() {
        // Inicjalizacja HMI
        this.hmi = new HMIManager({
            debug: true,
            element: document.getElementById('app-container')
        });

        // Inicjalizacja Voice HMI
        this.voiceHMI = new VoiceHMI(this.hmi, {
            language: 'pl-PL',
            voiceFeedback: true,
            gestureVoiceSync: true
        });

        // Rejestracja gestów i komend
        this.setupGestures();
        this.setupVoiceCommands();
        this.setupMultiModalInteractions();

        // Start
        this.hmi.start();
        this.voiceHMI.start();

        // Powitanie
        this.voiceHMI.tts.speak('Witaj! System głosowy jest gotowy do pracy.');

        console.log('✅ Voice-enabled app initialized');
    }

    setupGestures() {
        // Standardowe gesty
        this.hmi.gesture('delete_circle')
            .circle({ minRadius: 40 })
            .when(() => this.hasSelection())
            .on((result) => {
                this.deleteInCircle(result);
            });

        this.hmi.gesture('select_tap')
            .tap()
            .on((result) => {
                this.selectAt(result.position);
            });
    }

    setupVoiceCommands() {
        // CRUD Operations
        this.voiceHMI.gesture('create_component')
            .voice(/stwórz|utwórz|dodaj nowy|create/i)
            .on(() => {
                const component = this.createComponent();
                this.voiceHMI.tts.speak(`Utworzono ${component.type}`);
            });

        this.voiceHMI.gesture('delete_selected')
            .voice(/usuń zaznaczone|skasuj wybrane|delete selected/i)
            .on(() => {
                const count = this.selectedComponents.length;
                if (count > 0) {
                    this.deleteSelected();
                    this.voiceHMI.tts.speak(`Usunięto ${count} elementów`);
                } else {
                    this.voiceHMI.tts.speak('Nie ma zaznaczonych elementów');
                }
            });

        // Navigation
        this.voiceHMI.gesture('go_to_page')
            .voice(/idź do strony (\d+)|przejdź na stronę (\d+)/i)
            .on((data) => {
                const pageNumber = this.extractNumber(data.transcript);
                if (pageNumber) {
                    this.navigateToPage(pageNumber);
                    this.voiceHMI.tts.speak(`Przechodzę do strony ${pageNumber}`);
                }
            });

        // Search
        this.voiceHMI.gesture('search_components')
            .voice(/znajdź (.+)|szukaj (.+)|search (.+)/i)
            .on((data) => {
                const query = this.extractSearchQuery(data.transcript);
                const results = this.searchComponents(query);
                this.voiceHMI.tts.speak(`Znaleziono ${results.length} wyników dla "${query}"`);
            });

        // Help
        this.voiceHMI.gesture('voice_help')
            .voice(/pomoc|help|co mogę powiedzieć/i)
            .on(() => {
                this.showVoiceHelp();
            });
    }

    setupMultiModalInteractions() {
        // Głos + Gest = Zaawansowana akcja
        this.voiceHMI.multiModalGesture('smart_delete')
            .whenSaying(/usuń|delete/i)
            .whileGesturing('circle', { minRadius: 50 })
            .then((data) => {
                console.log('🎯 Multi-modal delete activated!');
                this.smartDelete(data);
                this.voiceHMI.tts.speak('Wykonano inteligentne usuwanie');
            });

        // Kontekstowe komendy
        this.voiceHMI.gesture('contextual_action')
            .voice(/zrób to|wykonaj|do it/i)
            .on(() => {
                this.executeContextualAction();
            });
    }

    // Helper methods
    showVoiceHelp() {
        const helpText = `
            Dostępne komendy głosowe:
            - "Stwórz" - tworzy nowy element
            - "Usuń zaznaczone" - usuwa wybrane elementy
            - "Znajdź" i nazwa - wyszukuje elementy
            - "Idź do strony" i numer - nawigacja
            - "Pomoc" - wyświetla tę listę
            
            Możesz też używać gestów podczas mówienia dla zaawansowanych akcji.
        `;
        
        this.voiceHMI.tts.speak(helpText);
        
        // Pokaż też wizualnie
        this.showHelpDialog(helpText);
    }

    extractNumber(text) {
        const match = text.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    extractSearchQuery(text) {
        const patterns = [/znajdź (.+)/, /szukaj (.+)/, /search (.+)/];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        return '';
    }
}

// ===========================
// 2. ACCESSIBILITY FEATURES
// ===========================
class AccessibilityVoiceHMI {
    constructor(hmi, voiceHMI) {
        this.hmi = hmi;
        this.voiceHMI = voiceHMI;
        this.screenReaderMode = false;
        
        this.setupAccessibilityFeatures();
    }

    setupAccessibilityFeatures() {
        // Screen reader mode
        this.voiceHMI.gesture('toggle_screen_reader')
            .voice(/włącz czytanie|screen reader|tryb dostępności/i)
            .on(() => {
                this.toggleScreenReader();
            });

        // Opisywanie elementów
        this.voiceHMI.gesture('describe_element')
            .voice(/co to jest|opisz|describe/i)
            .on(() => {
                this.describeCurrentElement();
            });

        // Nawigacja głosowa
        this.voiceHMI.gesture('voice_navigation')
            .voice(/następny element|poprzedni element|next|previous/i)
            .on((data) => {
                this.navigateByVoice(data.transcript);
            });

        // Dyktowanie tekstu
        this.voiceHMI.gesture('dictate_text')
            .voice(/napisz (.+)|wpisz (.+)|type (.+)/i)
            .on((data) => {
                const text = this.extractDictatedText(data.transcript);
                this.insertText(text);
                this.voiceHMI.tts.speak(`Wpisano: ${text}`);
            });
    }

    toggleScreenReader() {
        this.screenReaderMode = !this.screenReaderMode;
        
        if (this.screenReaderMode) {
            this.voiceHMI.tts.speak('Tryb czytania ekranu włączony');
            this.startScreenReading();
        } else {
            this.voiceHMI.tts.speak('Tryb czytania ekranu wyłączony');
            this.stopScreenReading();
        }
    }

    startScreenReading() {
        // Automatyczne czytanie przy najechaniu
        document.addEventListener('mouseover', this.readElement);
        document.addEventListener('focus', this.readElement, true);
    }

    readElement = (event) => {
        if (!this.screenReaderMode) return;
        
        const element = event.target;
        const text = this.getElementDescription(element);
        
        if (text) {
            this.voiceHMI.tts.speak(text, { 
                volume: 0.8,
                rate: 1.2 
            });
        }
    }

    getElementDescription(element) {
        // Accessibility labels
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }
        
        // Button or link text
        if (element.tagName === 'BUTTON' || element.tagName === 'A') {
            return `${element.tagName === 'BUTTON' ? 'Przycisk' : 'Link'}: ${element.textContent}`;
        }
        
        // Input fields
        if (element.tagName === 'INPUT') {
            const type = element.type;
            const value = element.value || 'puste';
            return `Pole ${type}: ${value}`;
        }
        
        // Generic text
        if (element.textContent && element.textContent.trim().length < 100) {
            return element.textContent.trim();
        }
        
        return null;
    }
}

// ===========================
// 3. VOICE FEEDBACK SYSTEM
// ===========================
class VoiceFeedbackSystem {
    constructor(voiceHMI) {
        this.voiceHMI = voiceHMI;
        this.feedbackEnabled = true;
        this.feedbackQueue = [];
        
        this.setupFeedbackSystem();
    }

    setupFeedbackSystem() {
        // Różne poziomy feedback
        this.feedbackLevels = {
            minimal: {
                volume: 0.5,
                rate: 1.5,
                sounds: true,
                speech: false
            },
            normal: {
                volume: 0.8,
                rate: 1.2,
                sounds: true,
                speech: true
            },
            verbose: {
                volume: 1.0,
                rate: 1.0,
                sounds: true,
                speech: true,
                details: true
            }
        };
        
        this.currentLevel = 'normal';
    }

    // Feedback dla różnych akcji
    actionFeedback(action, data = {}) {
        if (!this.feedbackEnabled) return;
        
        const level = this.feedbackLevels[this.currentLevel];
        
        const feedbackMap = {
            // Sukces
            'component_created': {
                sound: 'success',
                message: 'Utworzono nowy komponent',
                details: `Typ: ${data.type}, ID: ${data.id}`
            },
            'components_deleted': {
                sound: 'delete',
                message: `Usunięto ${data.count} elementów`,
                details: `Zwolniono ${data.freedSpace} pamięci`
            },
            'file_saved': {
                sound: 'save',
                message: 'Zapisano pomyślnie',
                details: `Plik: ${data.filename}`
            },
            
            // Błędy
            'error_occurred': {
                sound: 'error',
                message: 'Wystąpił błąd',
                details: data.error
            },
            'validation_failed': {
                sound: 'warning',
                message: 'Nieprawidłowe dane',
                details: data.fields?.join(', ')
            },
            
            // Informacje
            'selection_changed': {
                sound: 'select',
                message: `Zaznaczono ${data.count} elementów`
            },
            'mode_changed': {
                sound: 'switch',
                message: `Zmieniono tryb na ${data.mode}`
            }
        };
        
        const feedback = feedbackMap[action];
        if (!feedback) return;
        
        // Dźwięk
        if (level.sounds && feedback.sound) {
            this.playSound(feedback.sound);
        }
        
        // Mowa
        if (level.speech && feedback.message) {
            let text = feedback.message;
            if (level.details && feedback.details) {
                text += `. ${feedback.details}`;
            }
            
            this.voiceHMI.tts.speak(text, {
                volume: level.volume,
                rate: level.rate,
                queue: true
            });
        }
    }

    // System dźwięków
    playSound(soundType) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const sounds = {
            success: { frequency: 800, duration: 0.1 },
            error: { frequency: 200, duration: 0.3 },
            warning: { frequency: 400, duration: 0.2 },
            select: { frequency: 600, duration: 0.05 },
            delete: { frequency: 300, duration: 0.15 },
            save: { frequency: 1000, duration: 0.1 },
            switch: { frequency: 500, duration: 0.08 }
        };
        
        const sound = sounds[soundType] || sounds.select;
        
        oscillator.frequency.value = sound.frequency;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sound.duration);
    }

    // Zmiana poziomu feedback
    setFeedbackLevel(level) {
        if (this.feedbackLevels[level]) {
            this.currentLevel = level;
            this.voiceHMI.tts.speak(`Poziom komunikatów: ${level}`);
        }
    }
}

// ===========================
// 4. VOICE SHORTCUTS MANAGER
// ===========================
class VoiceShortcutsManager {
    constructor(voiceHMI) {
        this.voiceHMI = voiceHMI;
        this.shortcuts = new Map();
        this.macros = new Map();
        
        this.setupDefaultShortcuts();
    }

    setupDefaultShortcuts() {
        // Szybkie akcje
        this.addShortcut('quick_save', /zapisz szybko|quick save|ctrl s/i, () => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 's',
                ctrlKey: true
            }));
        });

        this.addShortcut('undo', /cofnij|undo|ctrl z/i, () => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'z',
                ctrlKey: true
            }));
        });

        this.addShortcut('redo', /ponów|przywróć|redo|ctrl y/i, () => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'y',
                ctrlKey: true
            }));
        });

        // Makra
        this.addMacro('cleanup_workspace', /wyczyść obszar roboczy|cleanup/i, [
            () => this.deselectAll(),
            () => this.removeUnused(),
            () => this.organizeComponents(),
            () => this.voiceHMI.tts.speak('Obszar roboczy wyczyszczony')
        ]);
    }

    addShortcut(name, pattern, action) {
        const id = this.voiceHMI.stt.registerCommand(pattern, () => {
            console.log(`🎤 Voice shortcut: ${name}`);
            action();
        });
        
        this.shortcuts.set(name, { id, pattern, action });
    }

    addMacro(name, pattern, actions) {
        const id = this.voiceHMI.stt.registerCommand(pattern, async () => {
            console.log(`🎤 Voice macro: ${name}`);
            this.voiceHMI.tts.speak(`Wykonuję makro ${name}`);
            
            for (const action of actions) {
                await action();
                await this.delay(500); // Delay between actions
            }
        });
        
        this.macros.set(name, { id, pattern, actions });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Pomocnicze metody dla makr
    deselectAll() {
        console.log('Deselecting all...');
        // Implementacja
    }

    removeUnused() {
        console.log('Removing unused components...');
        // Implementacja
    }

    organizeComponents() {
        console.log('Organizing components...');
        // Implementacja
    }
}

// ===========================
// 5. PRZYKŁAD KOMPLETNEJ INTEGRACJI
// ===========================
async function initializeVoiceHMISystem() {
    // Podstawowy HMI
    const hmi = new HMIManager({
        debug: true,
        element: document.body
    });

    // Voice HMI
    const voiceHMI = new VoiceHMI(hmi, {
        language: 'pl-PL',
        voiceFeedback: true
    });

    // Systemy dodatkowe
    const accessibility = new AccessibilityVoiceHMI(hmi, voiceHMI);
    const feedback = new VoiceFeedbackSystem(voiceHMI);
    const shortcuts = new VoiceShortcutsManager(voiceHMI);

    // Aplikacja
    const app = new VoiceEnabledApp();
    app.hmi = hmi;
    app.voiceHMI = voiceHMI;
    app.feedback = feedback;

    // Inicjalizacja
    await app.init();

    // Test systemu
    console.log('🎤 Voice HMI System Ready!');
    console.log('Say "pomoc" for available commands');

    // Eksport dla debugowania
    window.voiceHMISystem = {
        hmi,
        voiceHMI,
        app,
        accessibility,
        feedback,
        shortcuts,
        
        // Debug functions
        testTTS: (text) => voiceHMI.tts.speak(text),
        testSTT: () => voiceHMI.stt.start(),
        getStatus: () => ({
            stt: voiceHMI.stt.getDebugInfo(),
            tts: voiceHMI.tts.getDebugInfo(),
            gestures: hmi.getMetrics()
        })
    };

    return window.voiceHMISystem;
}

// Auto-init jeśli w przeglądarce
if (typeof window !== 'undefined' && window.document) {
    window.addEventListener('DOMContentLoaded', () => {
        // Przycisk do inicjalizacji (wymaga interakcji użytkownika dla audio)
        const button = document.createElement('button');
        button.textContent = '🎤 Włącz Voice HMI';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10000;
        `;
        
        button.onclick = async () => {
            await initializeVoiceHMISystem();
            button.textContent = '🎤 Voice Active';
            button.style.background = '#2196F3';
        };
        
        document.body.appendChild(button);
    });
}

// Export
export {
    VoiceEnabledApp,
    AccessibilityVoiceHMI,
    VoiceFeedbackSystem,
    VoiceShortcutsManager,
    initializeVoiceHMISystem
};