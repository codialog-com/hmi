/**
 * SIMPLE HMI SYSTEM
 * Prostszy, bardziej praktyczny system wykrywania gestów
 * Łatwy w debugowaniu, testowaniu i rozszerzaniu
 */

// ===========================
// 1. CORE - Prosty EventEmitter
// ===========================
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

// ===========================
// 2. GESTURE DETECTOR - Prosta klasa
// ===========================
class GestureDetector extends EventEmitter {
    constructor(element = document) {
        super();
        this.element = element;
        this.isActive = false;
        this.mouseHistory = [];
        this.touchHistory = [];
        this.config = {
            historySize: 50,
            sampleRate: 16, // ms
        };
        
        // Proste przechowywanie gestów
        this.gestures = new Map();
        this.lastSampleTime = 0;
    }

    // Prosta rejestracja gestów
    register(name, detector, callback) {
        this.gestures.set(name, {
            name,
            detector,
            callback,
            enabled: true,
            lastTriggered: 0,
            cooldown: 100
        });
    }

    // Start nasłuchiwania
    start() {
        if (this.isActive) return;
        this.isActive = true;
        
        // Proste event listenery
        this.element.addEventListener('mousedown', this.handleMouseDown);
        this.element.addEventListener('mousemove', this.handleMouseMove);
        this.element.addEventListener('mouseup', this.handleMouseUp);
        this.element.addEventListener('touchstart', this.handleTouchStart);
        this.element.addEventListener('touchmove', this.handleTouchMove);
        this.element.addEventListener('touchend', this.handleTouchEnd);
        
        // Prosta pętla detekcji
        this.detectLoop();
    }

    stop() {
        this.isActive = false;
        this.element.removeEventListener('mousedown', this.handleMouseDown);
        this.element.removeEventListener('mousemove', this.handleMouseMove);
        this.element.removeEventListener('mouseup', this.handleMouseUp);
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
    }

    // Event handlery (arrow functions dla prostszego bindowania)
    handleMouseDown = (e) => {
        this.mouseHistory = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
    }

    handleMouseMove = (e) => {
        const now = Date.now();
        if (now - this.lastSampleTime < this.config.sampleRate) return;
        
        this.lastSampleTime = now;
        this.mouseHistory.push({ x: e.clientX, y: e.clientY, time: now });
        
        if (this.mouseHistory.length > this.config.historySize) {
            this.mouseHistory.shift();
        }
    }

    handleMouseUp = (e) => {
        // Trigger detection on mouse up
        this.detect();
    }

    handleTouchStart = (e) => {
        this.touchHistory = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        }));
    }

    handleTouchMove = (e) => {
        // Update touch positions
        this.touchHistory = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        }));
    }

    handleTouchEnd = (e) => {
        this.detect();
    }

    // Prosta pętla detekcji
    detectLoop() {
        if (!this.isActive) return;
        
        this.detect();
        requestAnimationFrame(() => this.detectLoop());
    }

    // Główna logika detekcji
    detect() {
        const now = Date.now();
        
        for (const [name, gesture] of this.gestures) {
            if (!gesture.enabled) continue;
            if (now - gesture.lastTriggered < gesture.cooldown) continue;
            
            const result = gesture.detector(this.mouseHistory, this.touchHistory);
            
            if (result && result.detected) {
                gesture.lastTriggered = now;
                gesture.callback(result);
                this.emit('gesture', { name, result });
            }
        }
    }

    // Debug helpers
    getDebugInfo() {
        return {
            isActive: this.isActive,
            mouseHistoryLength: this.mouseHistory.length,
            touchHistoryLength: this.touchHistory.length,
            registeredGestures: Array.from(this.gestures.keys()),
            config: this.config
        };
    }
}

// ===========================
// 3. PATTERN DETECTORS - Proste funkcje
// ===========================
const PatternDetectors = {
    // Wykrywanie okręgu
    circle(history, options = {}) {
        const { minRadius = 30, maxRadius = 100, minPoints = 8 } = options;
        
        if (history.length < minPoints) {
            return { detected: false };
        }

        // Oblicz środek
        const centerX = history.reduce((sum, p) => sum + p.x, 0) / history.length;
        const centerY = history.reduce((sum, p) => sum + p.y, 0) / history.length;

        // Sprawdź czy punkty tworzą okrąg
        const distances = history.map(p => 
            Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
        );

        const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
        const variance = distances.reduce((sum, d) => sum + Math.abs(d - avgRadius), 0) / distances.length;

        const isCircle = variance < avgRadius * 0.3 && 
                        avgRadius > minRadius && 
                        avgRadius < maxRadius;

        return {
            detected: isCircle,
            center: { x: centerX, y: centerY },
            radius: avgRadius,
            confidence: isCircle ? 1 - (variance / avgRadius) : 0
        };
    },

    // Wykrywanie przeciągnięcia
    swipe(history, options = {}) {
        const { minDistance = 50, maxTime = 300, direction = null } = options;
        
        if (history.length < 2) {
            return { detected: false };
        }

        const start = history[0];
        const end = history[history.length - 1];
        const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const duration = end.time - start.time;

        if (distance < minDistance || duration > maxTime) {
            return { detected: false };
        }

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const detectedDirection = getDirection(angle);

        return {
            detected: !direction || direction === detectedDirection,
            direction: detectedDirection,
            distance,
            duration,
            speed: distance / duration
        };
    },

    // Wykrywanie tapnięcia
    tap(history, options = {}) {
        const { maxRadius = 10, maxTime = 200, count = 1 } = options;
        
        if (history.length < 2) {
            return { detected: false };
        }

        const start = history[0];
        const end = history[history.length - 1];
        const distance = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        const duration = end.time - start.time;

        return {
            detected: distance < maxRadius && duration < maxTime,
            position: { x: start.x, y: start.y },
            duration
        };
    },

    // Wykrywanie pinch (dla dotyku)
    pinch(history, touchHistory, options = {}) {
        const { minScale = 0.1 } = options;
        
        if (touchHistory.length !== 2) {
            return { detected: false };
        }

        const [touch1, touch2] = touchHistory;
        const currentDistance = Math.sqrt(
            (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2
        );

        // Tutaj należałoby śledzić początkową odległość
        // Dla uproszczenia zakładamy, że jest to przechowywane gdzie indziej
        const initialDistance = 100; // Placeholder
        const scale = currentDistance / initialDistance;

        return {
            detected: Math.abs(scale - 1) > minScale,
            scale,
            center: {
                x: (touch1.x + touch2.x) / 2,
                y: (touch1.y + touch2.y) / 2
            }
        };
    }
};

// Helper function
function getDirection(angle) {
    const deg = angle * 180 / Math.PI;
    if (deg > -45 && deg <= 45) return 'right';
    if (deg > 45 && deg <= 135) return 'down';
    if (deg > 135 || deg <= -135) return 'left';
    return 'up';
}

// ===========================
// 4. HMI MANAGER - Prosty orchestrator
// ===========================
class HMIManager {
    constructor(options = {}) {
        this.options = {
            debug: false,
            element: document,
            ...options
        };
        
        this.detector = new GestureDetector(this.options.element);
        this.contexts = new Map();
        this.activeContext = 'default';
        
        // Proste API do rejestracji gestów
        this.gestures = {};
    }

    // Fluent API do rejestracji gestów
    gesture(name) {
        const self = this;
        const config = {
            name,
            type: null,
            options: {},
            callback: null,
            conditions: []
        };

        const builder = {
            circle(options = {}) {
                config.type = 'circle';
                config.options = options;
                return builder;
            },
            
            swipe(direction, options = {}) {
                config.type = 'swipe';
                config.options = { direction, ...options };
                return builder;
            },
            
            tap(options = {}) {
                config.type = 'tap';
                config.options = options;
                return builder;
            },
            
            custom(detector) {
                config.type = 'custom';
                config.detector = detector;
                return builder;
            },
            
            when(condition) {
                config.conditions.push(condition);
                return builder;
            },
            
            on(callback) {
                config.callback = callback;
                
                // Rejestruj gest
                self._registerGesture(config);
                
                return builder;
            }
        };

        return builder;
    }

    _registerGesture(config) {
        const detector = (mouseHistory, touchHistory) => {
            // Sprawdź warunki
            if (!config.conditions.every(cond => cond())) {
                return { detected: false };
            }

            // Użyj odpowiedniego detektora
            switch (config.type) {
                case 'circle':
                    return PatternDetectors.circle(mouseHistory, config.options);
                case 'swipe':
                    return PatternDetectors.swipe(mouseHistory, config.options);
                case 'tap':
                    return PatternDetectors.tap(mouseHistory, config.options);
                case 'custom':
                    return config.detector(mouseHistory, touchHistory);
                default:
                    return { detected: false };
            }
        };

        this.detector.register(config.name, detector, config.callback);
        this.gestures[config.name] = config;
    }

    // Zarządzanie kontekstami
    setContext(name) {
        this.activeContext = name;
        this._updateActiveGestures();
    }

    addContext(name, gestures) {
        this.contexts.set(name, gestures);
    }

    _updateActiveGestures() {
        // Włącz/wyłącz gesty w zależności od kontekstu
        const contextGestures = this.contexts.get(this.activeContext) || [];
        
        for (const [name, gesture] of this.detector.gestures) {
            gesture.enabled = contextGestures.includes(name);
        }
    }

    // Lifecycle
    start() {
        this.detector.start();
        if (this.options.debug) {
            this._setupDebugMode();
        }
    }

    stop() {
        this.detector.stop();
    }

    // Debug mode
    _setupDebugMode() {
        console.log('🔍 HMI Debug Mode Enabled');
        
        this.detector.on('gesture', (data) => {
            console.log(`🎯 Gesture detected: ${data.name}`, data.result);
        });

        // Expose debug functions
        window.hmiDebug = {
            getState: () => this.detector.getDebugInfo(),
            getGestures: () => Object.keys(this.gestures),
            getContext: () => this.activeContext,
            triggerGesture: (name) => {
                const gesture = this.gestures[name];
                if (gesture && gesture.callback) {
                    gesture.callback({ detected: true, debug: true });
                }
            }
        };
    }

    // Utility methods
    getMetrics() {
        return {
            registeredGestures: Object.keys(this.gestures).length,
            activeContext: this.activeContext,
            isActive: this.detector.isActive,
            debugMode: this.options.debug
        };
    }
}

// ===========================
// 5. PRZYKŁAD UŻYCIA
// ===========================
/*
// Inicjalizacja
const hmi = new HMIManager({ 
    debug: true,
    element: document.getElementById('canvas')
});

// Rejestracja gestów
hmi.gesture('delete_circle')
    .circle({ minRadius: 40, maxRadius: 80 })
    .when(() => hasSelectedComponents())
    .on((result) => {
        console.log('Delete components in circle', result);
        deleteComponentsInArea(result.center, result.radius);
    });

hmi.gesture('navigate_swipe')
    .swipe('left', { minDistance: 100 })
    .on((result) => {
        console.log('Navigate left', result);
        navigateToNextPage();
    });

hmi.gesture('select_tap')
    .tap({ maxRadius: 15 })
    .on((result) => {
        console.log('Select at position', result.position);
        selectComponentAt(result.position);
    });

// Custom gesture
hmi.gesture('zigzag')
    .custom((mouseHistory) => {
        // Własna logika wykrywania
        const changes = detectDirectionChanges(mouseHistory);
        return {
            detected: changes > 3,
            changes
        };
    })
    .on((result) => {
        console.log('Zigzag detected', result);
    });

// Konteksty
hmi.addContext('canvas', ['delete_circle', 'select_tap']);
hmi.addContext('sidebar', ['navigate_swipe']);

// Start
hmi.start();

// Zmiana kontekstu
hmi.setContext('canvas');
*/

// ===========================
// 6. EXPORT
// ===========================
export { HMIManager, GestureDetector, PatternDetectors, EventEmitter };