/**
 * INTEGRACJA UPROSZCZONEGO SYSTEMU HMI
 * Przykłady użycia, integracji i testowania
 */

// ===========================
// 1. PRZYKŁAD INTEGRACJI Z APLIKACJĄ
// ===========================
import { HMIManager } from './simple-hmi-system.js';

class AppWithHMI {
    constructor() {
        this.hmi = null;
        this.components = [];
        this.selectedComponents = [];
    }

    async init() {
        // 1. Inicjalizacja HMI
        this.hmi = new HMIManager({
            debug: true,
            element: document.getElementById('app-container')
        });

        // 2. Rejestracja gestów
        this.registerGestures();

        // 3. Konfiguracja kontekstów
        this.setupContexts();

        // 4. Start systemu
        this.hmi.start();

        console.log('✅ App with HMI initialized');
    }

    registerGestures() {
        // CIRCLE - Usuwanie
        this.hmi.gesture('delete_components')
            .circle({ minRadius: 40, maxRadius: 100 })
            .when(() => this.hasSelection())
            .on((result) => {
                this.deleteComponentsInCircle(result.center, result.radius);
            });

        // SWIPE - Nawigacja
        this.hmi.gesture('navigate_left')
            .swipe('left', { minDistance: 100, maxTime: 500 })
            .on(() => {
                this.navigateToPrevious();
            });

        this.hmi.gesture('navigate_right')
            .swipe('right', { minDistance: 100, maxTime: 500 })
            .on(() => {
                this.navigateToNext();
            });

        // TAP - Selekcja
        this.hmi.gesture('select_component')
            .tap({ maxRadius: 15, maxTime: 200 })
            .on((result) => {
                this.selectComponentAt(result.position);
            });

        // CUSTOM - Podwójne kliknięcie
        this.hmi.gesture('double_tap')
            .custom((mouseHistory) => {
                return this.detectDoubleTap(mouseHistory);
            })
            .on((result) => {
                this.openComponentProperties(result.position);
            });
    }

    setupContexts() {
        // Kontekst canvas - wszystkie gesty aktywne
        this.hmi.addContext('canvas', [
            'delete_components',
            'select_component',
            'double_tap'
        ]);

        // Kontekst sidebar - tylko nawigacja
        this.hmi.addContext('sidebar', [
            'navigate_left',
            'navigate_right'
        ]);

        // Domyślnie canvas
        this.hmi.setContext('canvas');
    }

    // Helper methods
    hasSelection() {
        return this.selectedComponents.length > 0;
    }

    deleteComponentsInCircle(center, radius) {
        console.log(`🗑️ Deleting components in circle at ${center.x}, ${center.y} with radius ${radius}`);
        // Implementacja usuwania
    }

    selectComponentAt(position) {
        console.log(`🎯 Selecting component at ${position.x}, ${position.y}`);
        // Implementacja selekcji
    }

    detectDoubleTap(mouseHistory) {
        // Prosta detekcja podwójnego kliknięcia
        if (mouseHistory.length < 4) return { detected: false };
        
        const recent = mouseHistory.slice(-4);
        const timeDiff = recent[recent.length - 1].time - recent[0].time;
        
        if (timeDiff > 500) return { detected: false };
        
        // Sprawdź czy były 2 "tapy"
        const positions = recent.map(p => ({ x: p.x, y: p.y }));
        const maxDistance = 20;
        
        const allClose = positions.every(pos => {
            const dist = Math.sqrt(
                (pos.x - positions[0].x) ** 2 + 
                (pos.y - positions[0].y) ** 2
            );
            return dist < maxDistance;
        });

        return {
            detected: allClose,
            position: positions[0]
        };
    }
}

// ===========================
// 2. MODUŁ KEYBOARD + MOUSE
// ===========================
class KeyboardMouseIntegration {
    constructor(hmi) {
        this.hmi = hmi;
        this.keys = new Map();
        
        this.setupKeyboardTracking();
        this.registerCombinedGestures();
    }

    setupKeyboardTracking() {
        document.addEventListener('keydown', (e) => {
            this.keys.set(e.code, true);
        });

        document.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });
    }

    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }

    registerCombinedGestures() {
        // CTRL + Circle = Enhanced delete
        this.hmi.gesture('ctrl_circle_delete')
            .circle({ minRadius: 40 })
            .when(() => this.isKeyPressed('ControlLeft'))
            .on((result) => {
                console.log('🗑️ Enhanced delete with Ctrl+Circle');
                // Zaawansowane usuwanie
            });

        // SHIFT + Drag = Multi-select
        this.hmi.gesture('shift_drag_select')
            .custom((mouseHistory) => {
                if (!this.isKeyPressed('ShiftLeft')) {
                    return { detected: false };
                }
                
                // Wykryj przeciągnięcie
                if (mouseHistory.length < 2) {
                    return { detected: false };
                }
                
                const start = mouseHistory[0];
                const end = mouseHistory[mouseHistory.length - 1];
                const distance = Math.sqrt(
                    (end.x - start.x) ** 2 + 
                    (end.y - start.y) ** 2
                );
                
                return {
                    detected: distance > 50,
                    start,
                    end,
                    bounds: {
                        x: Math.min(start.x, end.x),
                        y: Math.min(start.y, end.y),
                        width: Math.abs(end.x - start.x),
                        height: Math.abs(end.y - start.y)
                    }
                };
            })
            .on((result) => {
                console.log('🎯 Multi-select with Shift+Drag', result.bounds);
                // Multi-selekcja
            });
    }
}

// ===========================
// 3. TESTY JEDNOSTKOWE
// ===========================
class HMITestSuite {
    static async runTests() {
        console.log('🧪 Running HMI Tests...\n');
        
        const results = [];
        
        // Test 1: Circle detection
        results.push(await this.testCircleDetection());
        
        // Test 2: Swipe detection
        results.push(await this.testSwipeDetection());
        
        // Test 3: Context switching
        results.push(await this.testContextSwitching());
        
        // Test 4: Custom gestures
        results.push(await this.testCustomGestures());
        
        // Podsumowanie
        this.printResults(results);
    }

    static async testCircleDetection() {
        const test = { name: 'Circle Detection', passed: false };
        
        try {
            // Generuj punkty okręgu
            const circlePoints = this.generateCirclePoints(
                { x: 100, y: 100 }, // center
                50, // radius
                20  // points
            );
            
            // Test detektora
            const result = PatternDetectors.circle(circlePoints, {
                minRadius: 30,
                maxRadius: 70
            });
            
            test.passed = result.detected && 
                         Math.abs(result.radius - 50) < 5 &&
                         result.confidence > 0.8;
            
            test.details = `Detected: ${result.detected}, Radius: ${result.radius?.toFixed(2)}, Confidence: ${result.confidence?.toFixed(2)}`;
        } catch (error) {
            test.error = error.message;
        }
        
        return test;
    }

    static async testSwipeDetection() {
        const test = { name: 'Swipe Detection', passed: false };
        
        try {
            // Generuj punkty swipe
            const swipePoints = this.generateSwipePoints(
                { x: 50, y: 100 },  // start
                { x: 200, y: 100 }, // end
                10 // points
            );
            
            // Test detektora
            const result = PatternDetectors.swipe(swipePoints, {
                minDistance: 100,
                maxTime: 500,
                direction: 'right'
            });
            
            test.passed = result.detected && 
                         result.direction === 'right' &&
                         result.distance > 140;
            
            test.details = `Detected: ${result.detected}, Direction: ${result.direction}, Distance: ${result.distance?.toFixed(2)}`;
        } catch (error) {
            test.error = error.message;
        }
        
        return test;
    }

    static async testContextSwitching() {
        const test = { name: 'Context Switching', passed: false };
        
        try {
            const hmi = new HMIManager();
            
            // Dodaj konteksty
            hmi.addContext('test1', ['gesture1', 'gesture2']);
            hmi.addContext('test2', ['gesture3']);
            
            // Zmień kontekst
            hmi.setContext('test1');
            const context1 = hmi.activeContext === 'test1';
            
            hmi.setContext('test2');
            const context2 = hmi.activeContext === 'test2';
            
            test.passed = context1 && context2;
            test.details = `Context switching works correctly`;
        } catch (error) {
            test.error = error.message;
        }
        
        return test;
    }

    static async testCustomGestures() {
        const test = { name: 'Custom Gestures', passed: false };
        
        try {
            let callbackCalled = false;
            const hmi = new HMIManager();
            
            // Rejestruj custom gesture
            hmi.gesture('test_custom')
                .custom((mouseHistory) => {
                    return { detected: mouseHistory.length > 5 };
                })
                .on(() => {
                    callbackCalled = true;
                });
            
            // Symuluj wykrycie
            const mockHistory = Array(10).fill(null).map((_, i) => ({
                x: i * 10,
                y: i * 10,
                time: Date.now() + i * 10
            }));
            
            const gesture = hmi.gestures['test_custom'];
            if (gesture && gesture.detector) {
                const result = gesture.detector(mockHistory, []);
                if (result.detected && gesture.callback) {
                    gesture.callback(result);
                }
            }
            
            test.passed = callbackCalled;
            test.details = `Custom gesture registration and execution works`;
        } catch (error) {
            test.error = error.message;
        }
        
        return test;
    }

    // Helper methods dla testów
    static generateCirclePoints(center, radius, count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * 2 * Math.PI;
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle),
                time: Date.now() + i * 10
            });
        }
        return points;
    }

    static generateSwipePoints(start, end, count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            points.push({
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t,
                time: Date.now() + i * 20
            });
        }
        return points;
    }

    static printResults(results) {
        console.log('\n📊 Test Results:');
        console.log('================');
        
        let passed = 0;
        results.forEach(test => {
            const status = test.passed ? '✅' : '❌';
            console.log(`${status} ${test.name}`);
            if (test.details) {
                console.log(`   ${test.details}`);
            }
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
            if (test.passed) passed++;
        });
        
        console.log('\n================');
        console.log(`Total: ${passed}/${results.length} tests passed`);
    }
}

// ===========================
// 4. NARZĘDZIA DEBUGOWANIA
// ===========================
class HMIDebugger {
    constructor(hmi) {
        this.hmi = hmi;
        this.overlay = null;
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        if (!this.overlay) {
            this.createOverlay();
        }
        this.overlay.style.display = 'block';
        this.isVisible = true;
        this.startUpdating();
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        this.isVisible = false;
        this.stopUpdating();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'hmi-debug-overlay';
        this.overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                min-width: 250px;
            ">
                <h3 style="margin: 0 0 10px 0;">🔍 HMI Debug</h3>
                <div id="hmi-debug-content"></div>
                <hr style="margin: 10px 0;">
                <button onclick="window.hmiDebugger.testGesture('circle')">Test Circle</button>
                <button onclick="window.hmiDebugger.testGesture('swipe')">Test Swipe</button>
                <button onclick="window.hmiDebugger.clear()">Clear</button>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    startUpdating() {
        this.updateInterval = setInterval(() => {
            this.updateDebugInfo();
        }, 100);
    }

    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    updateDebugInfo() {
        const content = document.getElementById('hmi-debug-content');
        if (!content) return;

        const metrics = this.hmi.getMetrics();
        const debugInfo = this.hmi.detector.getDebugInfo();

        content.innerHTML = `
            <div>Active: ${debugInfo.isActive ? '✅' : '❌'}</div>
            <div>Context: ${metrics.activeContext}</div>
            <div>Gestures: ${metrics.registeredGestures}</div>
            <div>Mouse History: ${debugInfo.mouseHistoryLength}</div>
            <div>Touch Points: ${debugInfo.touchHistoryLength}</div>
            <hr style="margin: 5px 0;">
            <div>Last Gesture: <span id="last-gesture">None</span></div>
        `;
    }

    testGesture(type) {
        console.log(`Testing ${type} gesture...`);
        // Implementacja testowania gestów
    }

    clear() {
        document.getElementById('last-gesture').textContent = 'None';
    }
}

// ===========================
// 5. PRZYKŁAD UŻYCIA
// ===========================
/*
// Inicjalizacja aplikacji z HMI
const app = new AppWithHMI();
await app.init();

// Dodaj integrację keyboard+mouse
const keyboardIntegration = new KeyboardMouseIntegration(app.hmi);

// Włącz debugger
const debugger = new HMIDebugger(app.hmi);
window.hmiDebugger = debugger;
debugger.show();

// Uruchom testy
await HMITestSuite.runTests();

// Zmiana kontekstu
document.getElementById('sidebar').addEventListener('mouseenter', () => {
    app.hmi.setContext('sidebar');
});

document.getElementById('canvas').addEventListener('mouseenter', () => {
    app.hmi.setContext('canvas');
});
*/

// Export
export { 
    AppWithHMI, 
    KeyboardMouseIntegration, 
    HMITestSuite, 
    HMIDebugger 
};