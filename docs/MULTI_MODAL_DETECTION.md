# 🎯 **MULTI-MODAL HMI DETECTION GUIDE**

> **Zaawansowane wykrywanie gestów z kombinacją klawiatury, myszy, dotyku i czasu**

## 📋 **SPIS TREŚCI**

1. [🎮 Podstawy Multi-Modal](#podstawy-multi-modal)
2. [⌨️ Integracja Klawiatura + Mysz](#integracja-klawiatura--mysz)
3. [🎪 Złożone Wzorce Gestów](#złożone-wzorce-gestów)
4. [🧠 Kontekstowe Adaptacje](#kontekstowe-adaptacje)
5. [📊 Przykłady Praktyczne](#przykłady-praktyczne)
6. [🔧 Konfiguracja Zaawansowana](#konfiguracja-zaawansowana)

---

## 🎮 **PODSTAWY MULTI-MODAL**

System HMI wykrywa **kombinacje** różnych rodzajów input:

```javascript
// ✅ TRADYCYJNIE (ograniczone):
document.addEventListener('keydown', handleKeyboard);
document.addEventListener('mousedown', handleMouse);

// 🚀 MULTI-MODAL HMI (zaawansowane):
hmiSystem.gesture('ctrl_circle_delete')
    .custom((mouseHistory) => {
        const hasCtrl = this.isKeyPressed('ControlLeft');
        const circle = this.detectCircle(mouseHistory);
        return hasCtrl && circle.matches;
    })
    .on(() => this.executeEnhancedDelete());
```

### **RODZAJE INPUTÓW WSPIERANYCH:**

| Input Type | Wykrywane Wzorce | Przykłady |
|------------|------------------|-----------|
| **🖱️ Mysz** | Circle, Swipe, Drag, Tap, Path | Koło, przeciągnij, kliknij |
| **⌨️ Klawiatura** | Shortcuts, Modifiers, Sequences | Ctrl+S, Shift+Drag, Alt+Circle |
| **👆 Dotyk** | Multi-touch, Pinch, Rotate | 2 palce, zoom, obrót |
| **⏱️ Czas** | Timing, Sequences, Delays | Szybkie akcje, opóźnienia |
| **🎯 Kontekst** | Element, Location, State | Canvas vs Panel, Selected vs Empty |

---

## ⌨️ **INTEGRACJA KLAWIATURA + MYSZ**

### **1. PODSTAWOWE KOMBINACJE:**

```javascript
// CTRL + CIRCLE = Zaawansowane usuwanie
hmiSystem.gesture('ctrl_circle_delete')
    .custom((mouseHistory) => {
        const hasCtrl = this.isKeyPressed('ControlLeft') || this.isKeyPressed('ControlRight');
        const circle = this.detectCircle(mouseHistory, { radius: 50, tolerance: 0.3 });
        return hasCtrl && circle.matches;
    })
    .on((data) => {
        console.info('🗑️ Enhanced delete with Ctrl+Circle');
        this.executeEnhancedDelete(data.result);
    });

// SHIFT + DRAG = Multi-selekcja
hmiSystem.gesture('shift_drag_multi_select')
    .custom((mouseHistory) => {
        const hasShift = this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight');
        const drag = this.detectDrag(mouseHistory, { minDistance: 20 });
        return hasShift && drag.matches;
    })
    .on((data) => {
        console.info('🎯 Multi-select with Shift+Drag');
        this.executeMultiSelect(data.result);
    });

// ALT + CIRCLE = Zaawansowane właściwości
hmiSystem.gesture('alt_circle_properties')
    .custom((mouseHistory) => {
        const hasAlt = this.isKeyPressed('AltLeft') || this.isKeyPressed('AltRight');
        const circle = this.detectCircle(mouseHistory);
        return hasAlt && circle.matches;
    })
    .on((data) => {
        console.info('⚙️ Advanced properties with Alt+Circle');
        this.showAdvancedProperties(data.result);
    });
```

### **2. ŚLEDZENIE STANU KLAWIATURY:**

```javascript
// System automatycznie śledzi stan klawiszy
this.keyboardState = new Map();

document.addEventListener('keydown', (e) => {
    this.keyboardState.set(e.code, {
        pressed: true,
        timestamp: performance.now(),
        modifiers: {
            ctrl: e.ctrlKey,
            shift: e.shiftKey,
            alt: e.altKey,
            meta: e.metaKey
        }
    });
});

document.addEventListener('keyup', (e) => {
    this.keyboardState.set(e.code, {
        pressed: false,
        timestamp: performance.now()
    });
});

// Funkcje pomocnicze:
isKeyPressed(keyCode) {
    return this.keyboardState.get(keyCode)?.pressed === true;
}

getCurrentModifiers() {
    const modifiers = {};
    for (const [key, state] of this.keyboardState) {
        if (state.pressed && state.modifiers) {
            Object.assign(modifiers, state.modifiers);
        }
    }
    return modifiers;
}
```

---

## 🎪 **ZŁOŻONE WZORCE GESTÓW**

### **1. SEKWENCJE CZASOWE:**

```javascript
// CTRL+S → CIRCLE → TAP = Save Workflow
hmiSystem.gesture('save_workflow')
    .sequence(
        { type: 'keyboard', key: 'KeyS', modifiers: ['ctrl'] },
        { type: 'mouseCircle', radius: 50, timeout: 2000 },
        { type: 'tap', count: 1, timeout: 1000 }
    )
    .on((data) => {
        console.info('💾 Save workflow executed!');
        this.executeSaveWorkflow(data.result);
    });

// POWER USER COMBO: Klawiatura + Gest + Timing
hmiSystem.gesture('power_user_combo')
    .custom((mouseHistory) => {
        const hasKeyboardShortcut = this.hasRecentKeyboardShortcut();
        const hasGesture = this.detectAnyGesture(mouseHistory);
        const correctTiming = this.validateComboTiming();
        
        return {
            matches: hasKeyboardShortcut && hasGesture && correctTiming,
            components: {
                keyboard: hasKeyboardShortcut,
                gesture: hasGesture,
                timing: correctTiming
            },
            confidence: 0.9
        };
    })
    .on((data) => {
        console.info('💪 Power user combo executed!');
        this.executePowerUserCombo(data.result);
    });
```

### **2. RAPID-FIRE WZORCE:**

```javascript
// SZYBKIE AKCJE (< 200ms między akcjami)
hmiSystem.gesture('rapid_fire_actions')
    .custom((mouseHistory) => {
        if (mouseHistory.length < 10) return { matches: false };

        const actions = this.segmentIntoActions(mouseHistory);
        const rapidActions = actions.filter(action => action.duration < 200);
        
        return {
            matches: rapidActions.length >= 3,
            actions: rapidActions,
            totalActions: actions.length,
            confidence: rapidActions.length / actions.length
        };
    })
    .on((data) => {
        console.info('⚡ Rapid fire actions detected!');
        this.executeRapidFireActions(data.result);
    });
```

### **3. MULTI-TOUCH KOMBINACJE:**

```javascript
// KOMBINACJE MULTI-TOUCH
hmiSystem.gesture('multi_touch_combo')
    .custom((mouseHistory, touchHistory) => {
        if (touchHistory.length < 2) return { matches: false };

        const touchPatterns = this.analyzeMultiTouchPatterns(touchHistory);
        
        return {
            matches: touchPatterns.hasComplexPattern,
            patterns: touchPatterns,
            touchCount: touchHistory.length,
            confidence: touchPatterns.confidence
        };
    })
    .on((data) => {
        console.info('👆 Multi-touch combo executed!');
        this.executeMultiTouchAction(data.result);
    });
```

---

## 🧠 **KONTEKSTOWE ADAPTACJE**

### **1. ADAPTACYJNE GESTY:**

```javascript
// CIRCLE - zachowanie zmienia się w zależności od kontekstu
hmiSystem.gesture('adaptive_circle')
    .mouseCircle(60, 0.3)
    .on((data) => {
        const context = this.getCurrentContext();
        const modifiers = this.getCurrentModifiers();
        
        switch (context) {
            case 'canvas':
                if (modifiers.ctrl) {
                    this.deleteInCircle(data.result);       // 🗑️ Usuń w kole
                } else if (modifiers.shift) {
                    this.selectInCircle(data.result);       // 🎯 Zaznacz w kole
                } else if (modifiers.alt) {
                    this.showCircleMenu(data.result);       // 📋 Menu kołowe
                } else {
                    this.createSelectionCircle(data.result); // ⭕ Zaznaczenie kołowe
                }
                break;
                
            case 'properties':
                if (modifiers.ctrl) {
                    this.resetProperties();                 // 🔄 Reset właściwości
                } else {
                    this.showPropertyHelp();               // ❓ Pomoc
                }
                break;
                
            case 'sidebar':
                this.refreshComponentPalette();            // 🔄 Odśwież paletę
                break;
                
            default:
                this.showContextHelp(data.result.center);  // ❓ Pomoc kontekstowa
        }
    });
```

### **2. WYKRYWANIE KONTEKSTU:**

```javascript
getCurrentContext() {
    const mousePosition = this.hmiSystem.getLastMousePosition();
    
    if (!mousePosition) return 'unknown';
    
    const element = document.elementFromPoint(mousePosition.x, mousePosition.y);
    
    // Hierarchiczne wykrywanie kontekstu
    if (element?.closest('#svg-canvas')) return 'canvas';
    if (element?.closest('.properties-panel')) return 'properties';
    if (element?.closest('.sidebar')) return 'sidebar';
    if (element?.closest('.toolbar')) return 'toolbar';
    
    return 'workspace';
}
```

---

## 📊 **PRZYKŁADY PRAKTYCZNE**

### **1. ZAAWANSOWANE USUWANIE:**

```javascript
// CTRL + CIRCLE = Enhanced Delete z konfirmacją
executeEnhancedDelete() {
    const selectedCount = this.getSelectedComponentCount();
    
    if (selectedCount > 3) {
        // Pokaż dialog konfirmacji dla wielu elementów
        this.showDeletionConfirmation(selectedCount, () => {
            this.managers.propertiesManager?.removeSelectedComponents();
        });
    } else {
        // Natychmiastowe usunięcie dla małej liczby
        this.managers.propertiesManager?.removeSelectedComponents();
    }
    
    this.trackAdvancedAction('enhanced_delete', { count: selectedCount });
}
```

### **2. INTELIGENTNE PRZECIĄGANIE:**

```javascript
// SMART DRAG - zachowanie zmienia się w zależności od selekcji
executeSmartDrag(hasSelection, modifiers, dragData) {
    if (hasSelection) {
        if (modifiers.ctrl) {
            this.copyDragSelectedComponents(dragData);      // 📋 Kopiuj + przenieś
        } else if (modifiers.shift) {
            this.constrainedDragSelectedComponents(dragData); // 📐 Ograniczone przesunięcie
        } else {
            this.moveSelectedComponents(dragData);          // ➡️ Zwykłe przesunięcie
        }
    } else {
        if (modifiers.shift) {
            this.createSelectionArea(dragData);             // 🎯 Obszar selekcji
        } else {
            this.panCanvas(dragData);                       // 🗺️ Panning canvas
        }
    }
}
```

### **3. WORKFLOW AUTOMATION:**

```javascript
// WORKFLOW CHAIN - automatyczna progresja
async executeComponentCreationWorkflow(workflowData) {
    const steps = workflowData.workflow.completedSteps;
    
    // Wykonaj kroki workflow z animacjami
    for (const step of steps) {
        await this.executeWorkflowStep(step);
        await this.showStepProgress(step);
    }

    // Auto-complete następne kroki jeśli możliwe
    if (workflowData.nextStep) {
        await this.suggestNextWorkflowStep(workflowData.nextStep);
    }
}
```

---

## 🔧 **KONFIGURACJA ZAAWANSOWANA**

### **1. PERSONALIZOWANE TOLERANCJE:**

```javascript
// System uczy się precyzji użytkownika
getAdaptiveTolerance(gestureType) {
    const history = this.getGestureHistory(gestureType);
    if (history.length < 5) return 0.3; // Domyślna tolerancja
    
    const averageDeviation = this.calculateAverageDeviation(history);
    return Math.max(0.1, Math.min(0.5, averageDeviation * 1.2));
}
```

### **2. POZIOM UMIEJĘTNOŚCI UŻYTKOWNIKA:**

```javascript
// Automatyczne dostosowanie do poziomu użytkownika
updateUserSkillLevel(actionData) {
    const complexActions = this.actionHistory.filter(a => 
        a.type.includes('combo') || 
        a.type.includes('expert') || 
        a.type.includes('rapid')
    );
    
    const recentComplexActions = complexActions.filter(a => 
        performance.now() - a.timestamp < 300000 // Ostatnie 5 minut
    );
    
    if (recentComplexActions.length > 10) {
        this.userSkillLevel = 'expert';        // 🎯 Ekspert
    } else if (recentComplexActions.length > 5) {
        this.userSkillLevel = 'advanced';      // 🚀 Zaawansowany
    } else if (recentComplexActions.length > 2) {
        this.userSkillLevel = 'intermediate';  // 📈 Średnio-zaawansowany
    } else {
        this.userSkillLevel = 'beginner';      // 🌱 Początkujący
    }
}
```

### **3. PERFORMANCE MONITORING:**

```javascript
// Monitoring wydajności w czasie rzeczywistym
getAdvancedMetrics() {
    return {
        totalActions: this.actionHistory.length,
        userSkillLevel: this.userSkillLevel,
        keyboardState: this.keyboardState.size,
        multiModalPatterns: this.multiModalPatterns.size,
        gestureAccuracy: this.calculateGestureAccuracy(),
        averageResponseTime: this.calculateAverageResponseTime(),
        contextSwitches: this.getContextSwitchCount()
    };
}
```

---

## 🎯 **SZYBKIE TESTY**

### **Przetestuj Multi-Modal Detection:**

```javascript
// W konsoli przeglądarki:

// 1. Sprawdź status HMI
console.info('HMI Status:', window.hmiIntegration?.getAdvancedMetrics());

// 2. Testuj Ctrl + Circle
// - Naciśnij Ctrl
// - Narysuj koło myszą na canvas
// - Zobacz enhanced delete w akcji

// 3. Testuj Shift + Drag  
// - Naciśnij Shift
// - Przeciągnij na canvas
// - Zobacz multi-select

// 4. Testuj Alt + Circle
// - Naciśnij Alt
// - Narysuj koło
// - Zobacz advanced properties

// 5. Monitoruj metryki
setInterval(() => {
    console.info('📊 HMI Metrics:', window.hmiIntegration?.getAdvancedMetrics());
}, 5000);
```

---

## 🚀 **NASTĘPNE KROKI**

1. **🎮 Przetestuj gestures** w głównej aplikacji
2. **📊 Monitoruj metryki** wydajności  
3. **🎯 Dostosuj tolerancje** do własnych preferencji
4. **🧠 Obserwuj adaptację** systemu do Twojego stylu
5. **💡 Dodaj własne wzorce** gestów w registry files

---

**System Multi-Modal HMI jest teraz w pełni zintegrowany z aplikacją! 🎉**
