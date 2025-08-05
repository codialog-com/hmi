# 🎤 Voice HMI Module - TTS & STT

## Wprowadzenie

Moduł głosowy rozszerza uproszczony system HMI o możliwości:
- **STT** (Speech-to-Text) - rozpoznawanie komend głosowych
- **TTS** (Text-to-Speech) - synteza mowy dla feedbacku
- **Multi-modal** - kombinacja gestów i głosu

## 🚀 Szybki Start

### 1. Podstawowa inicjalizacja

```javascript
import { HMIManager } from './simple-hmi-system.js';
import { VoiceHMI } from './voice-hmi-module.js';

// Inicjalizacja
const hmi = new HMIManager({ debug: true });
const voiceHMI = new VoiceHMI(hmi, {
    language: 'pl-PL',
    voiceFeedback: true
});

// Start (wymaga interakcji użytkownika)
button.onclick = () => {
    hmi.start();
    voiceHMI.start();
};
```

### 2. Rejestracja komend głosowych

```javascript
// Prosta komenda
voiceHMI.gesture('save_file')
    .voice(/zapisz|save/i)
    .on(() => {
        saveCurrentFile();
    })
    .speak('Zapisano plik');

// Komenda z parametrami
voiceHMI.gesture('go_to_page')
    .voice(/strona (\d+)|page (\d+)/i)
    .on((data) => {
        const pageNum = data.transcript.match(/\d+/)[0];
        navigateToPage(pageNum);
    })
    .speak((data) => `Przechodzę do strony ${pageNum}`);
```

### 3. Multi-modal (głos + gest)

```javascript
// Usuń mówiąc "usuń" i rysując okrąg
voiceHMI.multiModalGesture('smart_delete')
    .whenSaying(/usuń|delete/i)
    .whileGesturing('circle', { minRadius: 50 })
    .then(() => {
        deleteSelectedInCircle();
        voiceHMI.tts.speak('Usunięto elementy');
    });
```

## 📖 API Reference

### VoiceRecognition (STT)

```javascript
const stt = new VoiceRecognition({
    language: 'pl-PL',      // Język rozpoznawania
    continuous: true,       // Ciągłe nasłuchiwanie
    interimResults: true,   // Wyniki częściowe
    maxAlternatives: 3      // Liczba alternatyw
});

// Metody
stt.start();               // Rozpocznij nasłuchiwanie
stt.stop();                // Zatrzymaj
stt.registerCommand(pattern, callback); // Rejestruj komendę
stt.setLanguage('en-US');  // Zmień język

// Eventy
stt.on('result', (data) => {
    console.log(data.transcript);    // Rozpoznany tekst
    console.log(data.confidence);    // Pewność (0-1)
    console.log(data.isFinal);       // Czy finalne
});

stt.on('error', (error) => {
    console.error('STT Error:', error);
});
```

### VoiceSynthesis (TTS)

```javascript
const tts = new VoiceSynthesis({
    language: 'pl-PL',
    rate: 1.0,         // Prędkość (0.1-10)
    pitch: 1.0,        // Wysokość (0-2)
    volume: 1.0        // Głośność (0-1)
});

// Metody
await tts.speak('Tekst do przeczytania');
tts.pause();           // Pauza
tts.resume();          // Wznów
tts.stop();            // Zatrzymaj

// Kolejkowanie
tts.speak('Pierwszy tekst', { queue: true });
tts.speak('Drugi tekst', { queue: true });

// Różne głosy
const voices = tts.getVoices('pl');
tts.setVoice(voices[0]);
```

### VoiceHMI - Integracja

```javascript
// Gesture z głosem
voiceHMI.gesture('nazwa')
    .voice(/wzorzec/i)           // Wzorzec regex
    .withGesture('typ', opcje)   // Opcjonalny gest
    .on(callback)                // Handler
    .speak('odpowiedź');         // Feedback TTS

// Multi-modal
voiceHMI.multiModalGesture('nazwa')
    .whenSaying(/wzorzec/i)      // Warunek głosowy
    .whileGesturing('typ', opcje) // Warunek gestowy
    .then(callback);             // Wykonaj gdy oba spełnione
```

## 🎯 Przykłady Użycia

### 1. Nawigacja głosowa

```javascript
// Podstawowe komendy
const commands = [
    { pattern: /następny|next/i, action: 'next' },
    { pattern: /poprzedni|back/i, action: 'previous' },
    { pattern: /początek|home/i, action: 'home' },
    { pattern: /koniec|end/i, action: 'end' }
];

commands.forEach(({ pattern, action }) => {
    voiceHMI.gesture(`nav_${action}`)
        .voice(pattern)
        .on(() => navigate(action))
        .speak(`Przechodzę ${action}`);
});
```

### 2. Dyktowanie tekstu

```javascript
voiceHMI.gesture('dictation')
    .voice(/napisz (.+)|wpisz (.+)/i)
    .on((data) => {
        const text = data.transcript.replace(/napisz |wpisz /i, '');
        activeInput.value += text;
        voiceHMI.tts.speak(`Wpisano: ${text}`);
    });
```

### 3. Feedback głosowy dla akcji

```javascript
class VoiceFeedback {
    constructor(voiceHMI) {
        this.voiceHMI = voiceHMI;
    }

    success(message) {
        this.playSound(800, 0.1); // Wysoki dźwięk
        this.voiceHMI.tts.speak(message, {
            rate: 1.2,
            volume: 0.8
        });
    }

    error(message) {
        this.playSound(200, 0.3); // Niski dźwięk
        this.voiceHMI.tts.speak(`Błąd: ${message}`, {
            rate: 0.9,
            pitch: 0.8
        });
    }

    playSound(frequency, duration) {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
    }
}
```

### 4. Accessibility - Screen Reader

```javascript
class ScreenReader {
    constructor(voiceHMI) {
        this.voiceHMI = voiceHMI;
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
        document.addEventListener('focus', this.readElement, true);
        document.addEventListener('mouseover', this.readElement);
        this.voiceHMI.tts.speak('Czytnik ekranu włączony');
    }

    readElement = (event) => {
        if (!this.enabled) return;
        
        const element = event.target;
        const text = this.getAccessibleText(element);
        
        if (text) {
            this.voiceHMI.tts.speak(text, {
                rate: 1.3,
                volume: 0.7
            });
        }
    }

    getAccessibleText(element) {
        return element.getAttribute('aria-label') ||
               element.getAttribute('title') ||
               element.textContent?.trim().substring(0, 100);
    }
}
```

## 🌍 Obsługa języków

```javascript
// Zmiana języka w runtime
voiceHMI.stt.setLanguage('en-US');
voiceHMI.tts.options.language = 'en-US';

// Multi-język
const languages = {
    pl: {
        commands: {
            save: /zapisz|zachowaj/i,
            delete: /usuń|skasuj/i
        },
        responses: {
            saved: 'Zapisano',
            deleted: 'Usunięto'
        }
    },
    en: {
        commands: {
            save: /save|store/i,
            delete: /delete|remove/i
        },
        responses: {
            saved: 'Saved',
            deleted: 'Deleted'
        }
    }
};

function setupLanguage(lang) {
    const config = languages[lang];
    
    voiceHMI.gesture('save')
        .voice(config.commands.save)
        .on(() => save())
        .speak(config.responses.saved);
}
```

## 🔧 Konfiguracja i optymalizacja

### Redukcja szumów

```javascript
const stt = new VoiceRecognition({
    // Filtruj krótkie wypowiedzi
    minTranscriptLength: 3,
    
    // Ignoruj niską pewność
    minConfidence: 0.5,
    
    // Timeout ciszy
    silenceTimeout: 3000
});

stt.on('result', (data) => {
    if (data.confidence < 0.5) return; // Ignoruj
    if (data.transcript.length < 3) return; // Za krótkie
    
    processCommand(data);
});
```

### Optymalizacja TTS

```javascript
// Cache często używanych fraz
const phraseCache = new Map();

async function speakCached(text, options) {
    if (!phraseCache.has(text)) {
        const audio = await textToAudioBuffer(text, options);
        phraseCache.set(text, audio);
    }
    
    playAudioBuffer(phraseCache.get(text));
}

// Batch TTS dla długich tekstów
function speakLongText(text) {
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, i) => {
        voiceHMI.tts.speak(sentence, {
            queue: true,
            delay: i * 100
        });
    });
}
```

## 🐛 Rozwiązywanie problemów

### Brak mikrofonu

```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => {
        console.log('✅ Mikrofon dostępny');
        voiceHMI.start();
    })
    .catch((error) => {
        console.error('❌ Brak dostępu do mikrofonu:', error);
        showMicrophoneError();
    });
```

### Obsługa błędów STT

```javascript
stt.on('error', (error) => {
    switch(error) {
        case 'no-speech':
            console.log('Nie wykryto mowy');
            break;
        case 'audio-capture':
            console.log('Problem z mikrofonem');
            break;
        case 'not-allowed':
            console.log('Brak uprawnień');
            requestMicrophonePermission();
            break;
    }
});
```

### Debug mode

```javascript
// Włącz szczegółowe logi
voiceHMI.debug = true;

// Wizualizacja audio
function visualizeAudio() {
    const analyser = audioContext.createAnalyser();
    microphone.connect(analyser);
    
    const canvas = document.getElementById('audio-viz');
    const canvasCtx = canvas.getContext('2d');
    
    function draw() {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        
        // Rysuj spektrum
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        data.forEach((value, i) => {
            const height = value / 2;
            canvasCtx.fillRect(i * 2, canvas.height - height, 2, height);
        });
        
        requestAnimationFrame(draw);
    }
    draw();
}
```

## 📊 Metryki i analityka

```javascript
class VoiceAnalytics {
    constructor() {
        this.metrics = {
            totalCommands: 0,
            recognitionSuccess: 0,
            averageConfidence: 0,
            commandUsage: new Map()
        };
    }

    trackCommand(command, confidence) {
        this.metrics.totalCommands++;
        this.metrics.averageConfidence = 
            (this.metrics.averageConfidence * (this.metrics.totalCommands - 1) + confidence) / 
            this.metrics.totalCommands;
        
        const usage = this.metrics.commandUsage.get(command) || 0;
        this.metrics.commandUsage.set(command, usage + 1);
    }

    getReport() {
        return {
            ...this.metrics,
            successRate: this.metrics.recognitionSuccess / this.metrics.totalCommands,
            topCommands: Array.from(this.metrics.commandUsage.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
    }
}
```

## ✅ Najlepsze praktyki

1. **Zawsze testuj wsparcie przeglądarki**
2. **Używaj visual feedback wraz z audio**
3. **Implementuj fallback dla gestów**
4. **Cache często używane frazy TTS**
5. **Ogranicz continuous listening dla baterii**
6. **Używaj odpowiednich języków i głosów**
7. **Testuj w różnych środowiskach audio**

## 🔗 Zasoby

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Speech Recognition Grammar](https://www.w3.org/TR/speech-grammar/)
- [WCAG Speech Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/speech-input)

---

**Voice HMI Module - Making interfaces speak and listen! 🎤🔊**