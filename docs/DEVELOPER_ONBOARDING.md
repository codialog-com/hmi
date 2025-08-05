# 🎓 **DEVELOPER ONBOARDING GUIDE**

> **Kompletny przewodnik wdrożenia systemu HMI dla deweloperów**

## 🚀 **QUICK START**

### **Krok 1: Import i Podstawowa Integracja**

```javascript
// W głównym pliku aplikacji (app.js)
import { integrateHMIWithApp } from '../hmi/integration/app-hmi-integration.js';

export class MyApp {
    async setupHMISystem() {
        try {
            this.hmiIntegration = await integrateHMIWithApp(this);
            console.info('✅ HMI system ready!');
        } catch (error) {
            console.error('❌ HMI failed, using fallback:', error);
            this.setupEventListeners(); // Fallback
        }
    }
}
```

### **Krok 2: Podstawowe Gestures**

```javascript
import { HMISystem } from '../hmi/core/hmi-system.js';

export class MyComponent {
    async init() {
        const hmi = new HMISystem();
        await hmi.init();

        // ⭕ Circle gesture = delete
        hmi.gesture('delete_component')
            .mouseCircle(50, 0.3)
            .when(() => this.hasSelectedItems())
            .on(() => this.deleteSelectedItems());

        // 📏 Drag gesture = move
        hmi.gesture('move_component')
            .mouseDrag(20)
            .on((data) => this.moveItems(data.result));

        // ⌨️ Multi-modal: Ctrl + Circle = enhanced delete
        hmi.gesture('ctrl_enhanced_delete')
            .custom((mouseHistory) => {
                const hasCtrl = this.isKeyPressed('ControlLeft');
                const circle = this.detectCircle(mouseHistory);
                return hasCtrl && circle.matches;
            })
            .on(() => this.enhancedDelete());
    }
}
```

---

## 📦 **MIGRACJA ZE STARYCH EVENT LISTENERS**

### **❌ BEFORE: Traditional Event Listeners**

```javascript
class OldApp {
    setupEventListeners() {
        // Scattered event handlers
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') this.deleteComponent();
            if (e.ctrlKey && e.key === 's') this.saveProject();
        });
        
        // Manual gesture detection
        let mouseHistory = [];
        document.addEventListener('mousemove', (e) => {
            mouseHistory.push({x: e.clientX, y: e.clientY});
            if (this.isCircle(mouseHistory)) this.deleteComponent();
        });
    }
}
```

### **✅ AFTER: HMI System**

```javascript
class NewApp {
    async setupHMISystem() {
        const hmi = await integrateHMIWithApp(this);
        
        // Centralized, intelligent, adaptive
        hmi.gesture('circle_delete')
            .mouseCircle(50, 0.3)
            .when(() => this.hasSelection())
            .on(() => this.deleteSelection());
            
        hmi.gesture('save_workflow')
            .sequence(
                { type: 'keyboard', key: 'KeyS', modifiers: ['ctrl'] },
                { type: 'mouseCircle', radius: 50, timeout: 2000 }
            )
            .on(() => this.advancedSave());
    }
}
```

---

## 💡 **PRAKTYCZNE PRZYKŁADY**

### **Component Management**

```javascript
export class ComponentManager {
    async initHMI() {
        const hmi = new HMISystem();
        await hmi.init();

        // Selection
        hmi.gesture('select_component')
            .tap(1)
            .on((data) => {
                const component = this.getComponentAt(data.result.x, data.result.y);
                if (component) this.selectComponent(component);
            });

        // Multi-select with Shift+Drag
        hmi.gesture('multi_select')
            .custom((mouseHistory) => {
                const hasShift = this.isKeyPressed('ShiftLeft');
                const drag = this.detectDrag(mouseHistory);
                return hasShift && drag.matches;
            })
            .on((data) => this.selectMultipleComponents(data.result.area));

        // Copy/Paste workflow
        hmi.gesture('copy_paste_workflow')
            .sequence(
                { type: 'keyboard', key: 'KeyC', modifiers: ['ctrl'] },
                { type: 'mouseDrag', minDistance: 50, timeout: 3000 },
                { type: 'keyboard', key: 'KeyV', modifiers: ['ctrl'] }
            )
            .on((data) => this.smartCopyPaste(data.result));
    }
}
```

### **Canvas Interaction**

```javascript
export class CanvasManager {
    async initCanvasHMI() {
        const hmi = new HMISystem({ target: this.canvasElement });
        await hmi.init();

        // Navigation
        hmi.gesture('pan_canvas')
            .mouseDrag(10)
            .when(() => !this.hasSelectedComponents())
            .on((data) => this.panCanvas(data.result.vector));

        // Zoom
        hmi.gesture('zoom_gesture')
            .pinch(0.1)
            .on((data) => this.zoomCanvas(data.result.scale, data.result.center));

        // Smart drawing
        hmi.gesture('draw_connection')
            .mouseLine(50, 15)
            .when(() => this.isInConnectionMode())
            .on((data) => this.drawConnection(data.result.start, data.result.end));
    }
}
```

---

## 🔧 **BEST PRACTICES**

### **1. Naming Conventions**

```javascript
// ✅ GOOD - Descriptive, context-aware
hmi.gesture('canvas_component_delete')
hmi.gesture('properties_color_picker_open')

// ❌ BAD - Generic names
hmi.gesture('action1')
hmi.gesture('circle_thing')
```

### **2. Error Handling**

```javascript
export class RobustComponent {
    async initHMI() {
        try {
            this.hmi = new HMISystem();
            await this.hmi.init();
            this.setupAdvancedGestures();
        } catch (error) {
            console.warn('HMI failed, using traditional events:', error);
            this.setupTraditionalEventListeners();
        }
    }
}
```

### **3. Performance Optimization**

```javascript
export class OptimizedHMI {
    setupPerformantGestures() {
        const hmi = new HMISystem({
            performanceMode: true,
            historyLimit: 50,      // Limit memory usage
            tolerance: 0.3         // Higher tolerance = less CPU
        });

        // Debounce expensive operations
        hmi.gesture('expensive_operation')
            .mouseCircle(50)
            .debounce(300)
            .on((data) => this.expensiveCalculation(data));

        // Use cooldowns for rapid gestures
        hmi.gesture('rapid_action')
            .tap(2)
            .cooldown(1000)
            .on(() => this.rapidAction());
    }
}
```

---

## 🧪 **TESTING & DEBUGGING**

### **Debug Tools**

```javascript
// Enable debugging
window.hmi = hmiSystem;
window.hmi.enableDebugMode();

// Monitor performance
setInterval(() => {
    const metrics = window.hmi.getPerformanceMetrics();
    console.info('🔍 HMI Debug:', {
        activeGestures: metrics.activeGestures,
        averageFPS: metrics.averageFPS,
        memoryUsage: metrics.memoryMB
    });
}, 5000);

// Test gestures manually
window.testCircle = () => {
    window.hmi.simulateGesture('circle', {
        center: { x: 400, y: 300 },
        radius: 50
    });
};
```

### **Unit Testing**

```javascript
import { HMISystem } from './hmi/core/hmi-system.js';

describe('HMI System', () => {
    test('should detect circle gesture', async () => {
        const hmi = new HMISystem({ testMode: true });
        await hmi.init();
        
        let gestureDetected = false;
        hmi.gesture('test_circle')
            .mouseCircle(50, 0.3)
            .on(() => { gestureDetected = true; });

        const circlePoints = generateCirclePoints({ x: 100, y: 100 }, 50);
        await hmi.processMouseHistory(circlePoints);

        expect(gestureDetected).toBe(true);
    });
});
```

---

## ❓ **TROUBLESHOOTING**

### **Gestures nie są wykrywane**

```javascript
// Sprawdź konfigurację
console.info('🔍 Debug gesture detection:');
console.info('HMI Active:', window.hmi?.isActive);
console.info('Mouse History:', window.hmi?.getMouseHistory()?.length);

// Zwiększ tolerancję
hmi.gesture('debug_circle')
    .mouseCircle(50, 0.5) // Zwiększ z 0.3 do 0.5
    .on((data) => console.info('✅ Circle detected:', data.result.confidence));
```

### **Problemy z wydajnością**

```javascript
// Włącz performance mode
const hmi = new HMISystem({
    performanceMode: true,
    historyLimit: 30,
    gestureTimeout: 1000
});

// Monitor wydajności
setInterval(() => {
    const metrics = hmi.getPerformanceMetrics();
    if (metrics.averageFPS < 20) {
        console.warn('⚠️ Low FPS detected:', metrics);
    }
}, 5000);
```

### **Dodawanie własnych gestów**

```javascript
// Custom gesture detection
hmi.gesture('heart_shape')
    .custom((mouseHistory) => {
        const curves = this.detectCurves(mouseHistory);
        const symmetry = this.checkSymmetry(curves);
        
        return {
            matches: curves.length === 2 && symmetry > 0.7,
            confidence: symmetry,
            heartSize: this.calculateHeartSize(curves)
        };
    })
    .on((data) => this.executeHeartAction(data));
```

---

## 🎓 **GRADUATION CHECKLIST**

Po przejściu przez ten przewodnik, powinieneś umieć:

- [ ] ✅ **Migrować** stare event listeners do HMI
- [ ] 🎮 **Tworzyć** podstawowe i zaawansowane gestures  
- [ ] 🔗 **Integrować** HMI z istniejącymi componentami
- [ ] 🧪 **Testować** i debugować gesture detection
- [ ] ⚡ **Optymalizować** wydajność systemu
- [ ] 🛡️ **Obsługiwać** błędy i edge cases
- [ ] 📊 **Monitorować** metryki w production

## 🚀 **NASTĘPNE KROKI**

1. **Przetestuj przykłady** w swojej aplikacji
2. **Zastąp tradycyjne event listeners** systemem HMI
3. **Dodaj własne gesture patterns** specyficzne dla Twojej domeny
4. **Monitoruj wydajność** i dostrajaj tolerancje
5. **Rozszerz system** o dodatkowe modalności (voice, eye tracking, etc.)

**System HMI jest teraz gotowy do produkcji! 🎉**
