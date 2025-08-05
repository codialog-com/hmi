# 🎮 HMI - Native JS Gesture & Event Detection System

**Modularny system wykrywania gestów i zdarzeń oparty na natywnych wzorcach JavaScript**

## 📖 Spis Treści

- [🎯 Wprowadzenie](#wprowadzenie)
- [🏗️ Architektura](#architektura)
- [🚀 Szybki Start](#szybki-start)
- [📋 Registry System](#registry-system)
- [🎮 Gesture Detection](#gesture-detection)
- [🧩 Modularność](#modularność)
- [📚 API Reference](#api-reference)
- [💡 Przykłady Użycia](#przykłady-użycia)
- [🔧 Integracja](#integracja)

---

## 🎯 Wprowadzenie

HMI System to zaawansowane rozwiązanie do wykrywania gestów i zarządzania zdarzeniami w aplikacjach webowych, wykorzystujące **czyste natywne wzorce JavaScript**:

### ✨ Kluczowe Cechy

- **🎪 Proxy Magic** - dynamiczne tworzenie detektorów
- **🔒 Symbol Private State** - prawdziwe enkapsulowanie
- **💾 WeakMap Metadata** - zero memory leaks
- **⚡ Generator Sequences** - eleganckie wieloetapowe gesty
- **🎭 Fluent API** - naturalny syntax
- **🚀 RAF Performance** - 60fps smooth detection
- **📦 Modular Architecture** - kontekstowe registry files

### 🎯 Zastosowania

- **Gesture Detection**: circle, swipe, pinch, zigzag, custom patterns
- **Event Registry**: centralne zarządzanie zdarzeniami aplikacji
- **Workflow Detection**: wieloetapowe sekwencje akcji użytkownika
- **Performance Monitoring**: automatyczne wykrywanie bottlenecks
- **Analytics**: śledzenie zachowań użytkownika

---

## 🏗️ Architektura

```
hmi/
├── core/                    # Główne komponenty systemu
│   ├── gesture-detector.js  # Natywny detektor gestów
│   ├── event-registry.js    # Registry system
│   ├── pattern-matcher.js   # Pattern matching engine
│   └── performance-monitor.js # Performance tracking
├── registries/              # Kontekstowe registry files
│   ├── canvas-registry.js   # Gesty canvas (SVG, drawing)
│   ├── sidebar-registry.js  # Interakcje sidebar
│   ├── properties-registry.js # Panel właściwości
│   ├── workflow-registry.js # Workflow detection
│   └── global-registry.js   # Globalne akcje
├── examples/               # Przykłady użycia
│   ├── basic-gestures.js   # Podstawowe gesty
│   ├── advanced-patterns.js # Zaawansowane wzorce
│   └── integration-demo.js  # Demo integracji
├── docs/                   # Dokumentacja
│   ├── api-reference.md    # Dokumentacja API
│   ├── patterns-guide.md   # Przewodnik wzorców
│   └── integration-guide.md # Przewodnik integracji
└── tests/                  # Testy
    ├── gesture-tests.js    # Testy gestów
    └── registry-tests.js   # Testy registry
```

---

## 🚀 Szybki Start

### 1. Import Systemu

```javascript
import { HMISystem } from './hmi/core/hmi-system.js';
import { CanvasRegistry } from './hmi/registries/canvas-registry.js';
```

### 2. Inicjalizacja

```javascript
const hmi = new HMISystem();
const canvasRegistry = new CanvasRegistry(hmi);

// Auto-setup wszystkich registry
await hmi.init();
await canvasRegistry.init();
```

### 3. Podstawowe Gesty

```javascript
// Circle delete gesture
hmi.gesture('circle_delete')
   .mouseCircle(60, 0.4)
   .when(() => hasSelectedComponents())
   .on(data => deleteComponents());

// Swipe navigation
hmi.gesture('swipe_nav')
   .swipe('left', 100, 300)
   .on(data => navigateLeft());
```

---

## 📋 Registry System

### Kontekstowe Registry Files

Każdy kontekst aplikacji ma własny registry file:

#### **Canvas Registry** (`registries/canvas-registry.js`)
```javascript
export class CanvasRegistry {
    setup() {
        // SVG drawing gestures
        this.registerDrawingGestures();
        // Component manipulation
        this.registerComponentGestures();
        // Selection patterns
        this.registerSelectionGestures();
    }
}
```

#### **Sidebar Registry** (`registries/sidebar-registry.js`)
```javascript
export class SidebarRegistry {
    setup() {
        // Component palette interactions
        this.registerPaletteGestures();
        // List navigation
        this.registerNavigationGestures();
    }
}
```

#### **Properties Registry** (`registries/properties-registry.js`)
```javascript
export class PropertiesRegistry {
    setup() {
        // Form interactions
        this.registerFormGestures();
        // Color picker gestures
        this.registerColorGestures();
    }
}
```

---

## 🎮 Gesture Detection

### Podstawowe Gesty

#### **Circle Gesture**
```javascript
hmi.gesture('circle_action')
   .mouseCircle(radius, tolerance)
   .when(condition)
   .on(callback);
```

#### **Swipe Gesture**
```javascript
hmi.gesture('swipe_action')
   .swipe(direction, minDistance, maxTime)
   .on(callback);
```

#### **Custom Gesture**
```javascript
hmi.gesture('custom_action')
   .custom((mouseHistory, touchHistory) => {
       // Custom detection logic
       return { matches: boolean, data: object };
   })
   .on(callback);
```

### Zaawansowane Wzorce

#### **Sequence Gestures**
```javascript
hmi.gesture('workflow_sequence')
   .sequence(
       { type: 'drag', from: 'palette' },
       { type: 'drop', to: 'canvas' },
       { type: 'configure', target: 'properties' }
   )
   .on(data => completeWorkflow(data));
```

#### **Dynamic Detection (Proxy Magic)**
```javascript
// Automatically creates detection pattern
hmi.detectSwipeLeft({ minDistance: 100 })
   .on(data => previousItem());

hmi.detectPinchZoom({ threshold: 0.1 })
   .on(data => zoomCanvas(data.scale));
```

---

## 🧩 Modularność

### Registry Pattern

Każdy kontekst ma dedykowany registry:

```javascript
// canvas-registry.js
export class CanvasRegistry extends BaseRegistry {
    constructor(hmiSystem) {
        super(hmiSystem, 'canvas');
    }

    setupGestures() {
        // Component selection
        this.registerGesture('multi_select', {
            pattern: 'ctrl_click',
            handler: this.handleMultiSelect.bind(this)
        });

        // Component movement
        this.registerGesture('move_component', {
            pattern: 'drag_drop',
            handler: this.handleComponentMove.bind(this)
        });
    }
}
```

### Context Switching

```javascript
// Automatyczne przełączanie kontekstu
hmi.setActiveContext('canvas');  // Aktywuje canvas-registry
hmi.setActiveContext('sidebar'); // Aktywuje sidebar-registry
```

---

## 📚 API Reference

### HMISystem

```javascript
class HMISystem {
    // Initialization
    async init(options = {})
    
    // Gesture Management
    gesture(name) → GestureBuilder
    detectPattern(pattern, options) → PatternDetector
    
    // Registry Management
    registerRegistry(name, registry)
    setActiveContext(contextName)
    
    // Performance
    getPerformanceMetrics()
    enableDebugMode()
}
```

### GestureBuilder (Fluent API)

```javascript
gesture(name)
    .mouseCircle(radius, tolerance)
    .swipe(direction, minDistance, maxTime)
    .custom(detectionFunction)
    .when(conditionFunction)
    .on(handlerFunction)
    .cooldown(milliseconds)
```

### Event Data Structure

```javascript
{
    name: 'gesture_name',
    type: 'mouse_circle',
    result: {
        matches: true,
        confidence: 0.85,
        // Pattern-specific data
        center: { x: 100, y: 200 },
        radius: 45
    },
    timestamp: performance.now(),
    target: HTMLElement,
    context: 'canvas'
}
```

---

## 💡 Przykłady Użycia

### 1. Podstawowe Gesty Canvas

```javascript
// Circle delete on selected components
canvasRegistry.gesture('circle_delete')
    .mouseCircle(50, 0.3)
    .when(() => hasSelectedComponents())
    .on(data => {
        deleteSelectedComponents();
        showConfirmation('Deleted', data.result.center);
    });

// Lasso selection
canvasRegistry.gesture('lasso_select')
    .custom(mouseHistory => {
        const path = mouseHistory.map(p => ({x: p.x, y: p.y}));
        const components = getComponentsInPath(path);
        return {
            matches: components.length > 0,
            components
        };
    })
    .on(data => selectComponents(data.result.components));
```

### 2. Workflow Detection

```javascript
// Complete component creation workflow
workflowRegistry.gesture('create_component')
    .sequence(
        { type: 'pick', source: 'palette' },
        { type: 'place', target: 'canvas' },
        { type: 'configure', panel: 'properties' }
    )
    .on(data => {
        trackWorkflowCompletion('component_creation');
        showWorkflowTip('Great! Component created successfully');
    });
```

### 3. Advanced Performance Monitoring

```javascript
// Auto-optimization when performance drops
globalRegistry.gesture('performance_degradation')
    .custom((mouseHistory, touchHistory, performanceData) => {
        return {
            matches: performanceData.fps < 30,
            avgFps: performanceData.fps,
            lastOperation: performanceData.lastOperation
        };
    })
    .on(data => {
        console.warn('Performance degradation detected:', data.result);
        enablePerformanceMode();
        notifyUser('Switching to performance mode');
    });
```

### 4. Multi-Touch Patterns

```javascript
// Pinch zoom with rotation detection
canvasRegistry.gesture('pinch_rotate')
    .custom((mouseHistory, touchHistory) => {
        if (touchHistory.length !== 2) return { matches: false };
        
        const [touch1, touch2] = touchHistory;
        const scale = calculatePinchScale(touch1, touch2);
        const rotation = calculateRotation(touch1, touch2);
        
        return {
            matches: Math.abs(scale - 1) > 0.1 || Math.abs(rotation) > 5,
            scale,
            rotation,
            center: calculateCenter(touch1, touch2)
        };
    })
    .on(data => {
        if (data.result.scale !== 1) {
            zoomCanvas(data.result.scale, data.result.center);
        }
        if (data.result.rotation !== 0) {
            rotateCanvas(data.result.rotation, data.result.center);
        }
    });
```

---

## 🔧 Integracja

### Integracja z Istniejącą Aplikacją

#### 1. Zastępowanie Event Listeners

**PRZED:**
```javascript
// Traditional event listeners
exportBtn.addEventListener('click', exportProject);
canvas.addEventListener('mousedown', startSelection);
document.addEventListener('keydown', handleKeyboard);
```

**PO:**
```javascript
// Registry-driven events
globalRegistry.gesture('export_action')
    .click('#export-btn')
    .on(exportProject);

canvasRegistry.gesture('start_selection')
    .mouseDown('canvas')
    .on(startSelection);

globalRegistry.gesture('keyboard_shortcuts')
    .keySequence(['ctrl', 's'])
    .on(saveProject);
```

#### 2. Migration Guide

```javascript
// Step 1: Initialize HMI System
const hmi = new HMISystem();
await hmi.init();

// Step 2: Load context registries
const registries = [
    new CanvasRegistry(hmi),
    new SidebarRegistry(hmi),
    new PropertiesRegistry(hmi),
    new WorkflowRegistry(hmi)
];

await Promise.all(registries.map(r => r.init()));

// Step 3: Remove old event listeners
// removeOldEventListeners(); // Your cleanup function

// Step 4: Start gesture detection
hmi.startDetection();
```

#### 3. Debug & Testing

```javascript
// Console debugging
window.hmi = hmi;
window.toggleGestures = (enabled) => hmi.toggleDetection(enabled);
window.gestureStats = () => hmi.getPerformanceMetrics();

// Real-time gesture monitoring
hmi.enableDebugMode();
hmi.on('gesture_detected', data => {
    console.log(`🎯 Gesture: ${data.name}`, data.result);
});
```

---

## 🎯 Następne Kroki

1. **Zainstaluj System**: Skopiuj pliki do projektu
2. **Wybierz Registry**: Użyj odpowiednich kontekstów
3. **Skonfiguruj Gesty**: Dostosuj do swoich potrzeb
4. **Testuj**: Używaj debug mode do optymalizacji
5. **Rozszerz**: Dodaj własne custom patterns

---

## 📞 Wsparcie

- 📖 **API Docs**: `docs/api-reference.md`
- 🎮 **Pattern Guide**: `docs/patterns-guide.md`
- 🔧 **Integration**: `docs/integration-guide.md`
- 💡 **Examples**: Sprawdź folder `examples/`

---

**HMI System - Where Native JavaScript Meets Advanced Gesture Detection** 🚀
