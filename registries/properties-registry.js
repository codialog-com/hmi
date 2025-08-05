/**
 * PROPERTIES REGISTRY - Property Panel Gesture Detection
 * Specialized gestures for property editing and configuration
 */

import { BaseRegistry } from './base-registry.js';

export class PropertiesRegistry extends BaseRegistry {
    constructor(hmiSystem) {
        super(hmiSystem, 'properties');
        
        this.propertiesPanel = null;
        this.activePropertyGroup = null;
        this.formElements = new Map();
        this.gestureQueue = [];
        this.multiEditMode = false;
    }

    /**
     * 🎯 PROPERTIES-SPECIFIC GESTURE SETUP
     */
    async setupGestures() {
        // Find properties panel
        this.propertiesPanel = document.querySelector('.properties-panel') || 
                              document.querySelector('#properties-panel') ||
                              document.querySelector('.right-panel');

        if (!this.propertiesPanel) {
            console.warn('⚠️ Properties panel not found');
            return;
        }

        console.info(`🔧 Setting up properties gestures for:`, this.propertiesPanel);

        // 1. FORM INTERACTION GESTURES
        this.setupFormGestures();
        
        // 2. COLOR PICKER GESTURES
        this.setupColorGestures();
        
        // 3. VALUE ADJUSTMENT GESTURES
        this.setupValueGestures();
        
        // 4. MULTI-EDIT GESTURES
        this.setupMultiEditGestures();
        
        // 5. NAVIGATION GESTURES
        this.setupPropertyNavigationGestures();
    }

    /**
     * 📝 FORM INTERACTION GESTURES
     */
    setupFormGestures() {
        // Quick value input (double tap on input field)
        this.registerGesture('quick_input', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectQuickInput(mouseHistory)
            },
            handler: this.handleQuickInput,
            conditions: [() => this.isMouseOnInput()],
            cooldown: 300
        });

        // Form section collapse/expand (circle on section header)
        this.registerGesture('toggle_section', {
            pattern: {
                type: 'mouse_circle',
                radius: 30,
                tolerance: 0.6
            },
            handler: this.handleToggleSection,
            conditions: [() => this.isMouseOnSectionHeader()],
            cooldown: 400
        });

        // Clear all values (zigzag over form)
        this.registerGesture('clear_form', {
            pattern: {
                type: 'mouse_zigzag',
                minPoints: 4,
                amplitude: 25
            },
            handler: this.handleClearForm,
            conditions: [() => this.isMouseOnForm() && this.hasFormValues()],
            cooldown: 1000
        });

        // Apply to all (upward swipe)
        this.registerGesture('apply_to_all', {
            pattern: {
                type: 'swipe',
                direction: 'up',
                minDistance: 60,
                maxTime: 400
            },
            handler: this.handleApplyToAll,
            conditions: [() => this.isMultiSelectMode()],
            cooldown: 500
        });
    }

    /**
     * 🎨 COLOR PICKER GESTURES
     */
    setupColorGestures() {
        // Color wheel selection (circle on color picker)
        this.registerGesture('color_wheel_select', {
            pattern: {
                type: 'mouse_circle',
                radius: 40,
                tolerance: 0.5
            },
            handler: this.handleColorWheelSelect,
            conditions: [() => this.isMouseOnColorPicker()],
            cooldown: 100
        });

        // Color palette quick select (tap sequence)
        this.registerGesture('palette_quick_select', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectPaletteSelection(mouseHistory)
            },
            handler: this.handlePaletteQuickSelect,
            conditions: [() => this.isMouseOnColorPalette()],
            cooldown: 200
        });

        // Color gradient selection (line across gradient)
        this.registerGesture('gradient_select', {
            pattern: {
                type: 'mouse_line',
                minLength: 40,
                maxDeviation: 10
            },
            handler: this.handleGradientSelect,
            conditions: [() => this.isMouseOnGradient()],
            cooldown: 100
        });

        // Copy color (small circle + swipe)
        this.registerGesture('copy_color', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectCopyColor(mouseHistory)
            },
            handler: this.handleCopyColor,
            conditions: [() => this.isMouseOnColorValue()],
            cooldown: 300
        });
    }

    /**
     * 🔢 VALUE ADJUSTMENT GESTURES
     */
    setupValueGestures() {
        // Numeric increment/decrement (vertical swipe on number input)
        this.registerGesture('adjust_numeric_value', {
            pattern: {
                type: 'swipe',
                direction: null, // vertical only
                minDistance: 30,
                maxTime: 300
            },
            handler: this.handleAdjustNumericValue,
            conditions: [() => this.isMouseOnNumericInput()],
            cooldown: 50
        });

        // Slider gesture (horizontal line on slider)
        this.registerGesture('slider_adjust', {
            pattern: {
                type: 'mouse_line',
                minLength: 20,
                maxDeviation: 8
            },
            handler: this.handleSliderAdjust,
            conditions: [() => this.isMouseOnSlider()],
            cooldown: 50
        });

        // Reset to default (double circle on input)
        this.registerGesture('reset_value', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectDoubleCircle(mouseHistory)
            },
            handler: this.handleResetValue,
            conditions: [() => this.isMouseOnInput()],
            cooldown: 400
        });

        // Fine adjustment mode (small circle before adjustment)
        this.registerGesture('fine_adjustment', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectFineAdjustment(mouseHistory)
            },
            handler: this.handleFineAdjustment,
            conditions: [() => this.isMouseOnAdjustableInput()],
            cooldown: 100
        });
    }

    /**
     * 📋 MULTI-EDIT GESTURES
     */
    setupMultiEditGestures() {
        // Enter multi-edit mode (horizontal zigzag)
        this.registerGesture('enter_multi_edit', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectHorizontalZigzag(mouseHistory)
            },
            handler: this.handleEnterMultiEdit,
            conditions: [() => this.hasMultipleSelectedComponents()],
            cooldown: 500
        });

        // Sync values across selection (swipe right)
        this.registerGesture('sync_values', {
            pattern: {
                type: 'swipe',
                direction: 'right',
                minDistance: 80,
                maxTime: 400
            },
            handler: this.handleSyncValues,
            conditions: [() => this.multiEditMode],
            cooldown: 300
        });

        // Individual edit mode (circle on specific field)
        this.registerGesture('individual_edit', {
            pattern: {
                type: 'mouse_circle',
                radius: 20,
                tolerance: 0.8
            },
            handler: this.handleIndividualEdit,
            conditions: [() => this.multiEditMode],
            cooldown: 200
        });
    }

    /**
     * 🧭 PROPERTY NAVIGATION GESTURES
     */
    setupPropertyNavigationGestures() {
        // Next property group (swipe down)
        this.registerGesture('next_property_group', {
            pattern: {
                type: 'swipe',
                direction: 'down',
                minDistance: 50,
                maxTime: 300
            },
            handler: this.handleNextPropertyGroup,
            conditions: [() => this.hasMultiplePropertyGroups()],
            cooldown: 200
        });

        // Previous property group (swipe up)
        this.registerGesture('previous_property_group', {
            pattern: {
                type: 'swipe',
                direction: 'up',
                minDistance: 50,
                maxTime: 300
            },
            handler: this.handlePreviousPropertyGroup,
            conditions: [() => this.hasMultiplePropertyGroups()],
            cooldown: 200
        });

        // Property search (circle + line up)
        this.registerGesture('property_search', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectPropertySearch(mouseHistory)
            },
            handler: this.handlePropertySearch,
            cooldown: 600
        });

        // Show property help (long press + circle)
        this.registerGesture('show_property_help', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectLongPressCircle(mouseHistory)
            },
            handler: this.handleShowPropertyHelp,
            conditions: [() => this.isMouseOnPropertyLabel()],
            cooldown: 800
        });
    }

    /**
     * 🎯 DETECTION ALGORITHMS
     */
    detectQuickInput(mouseHistory) {
        if (mouseHistory.length < 3) return { matches: false };

        const taps = this.findTapSequence(mouseHistory, 300);
        const inputElement = this.getInputAtPosition(mouseHistory[0]);

        return {
            matches: taps.length >= 2 && inputElement,
            input: inputElement,
            taps,
            confidence: 0.9
        };
    }

    detectPaletteSelection(mouseHistory) {
        if (mouseHistory.length < 2) return { matches: false };

        const colorElement = this.getColorAtPosition(mouseHistory[0]);
        const isQuickTap = mouseHistory.length < 5;

        return {
            matches: colorElement && isQuickTap,
            color: colorElement,
            position: mouseHistory[0],
            confidence: 0.8
        };
    }

    detectCopyColor(mouseHistory) {
        if (mouseHistory.length < 6) return { matches: false };

        // Small circle followed by swipe
        const circleResult = this.detectSmallCircle(mouseHistory.slice(0, 4));
        const swipeResult = this.detectSwipeAfterCircle(mouseHistory.slice(2));

        return {
            matches: circleResult.matches && swipeResult.matches,
            circle: circleResult,
            swipe: swipeResult,
            confidence: (circleResult.confidence + swipeResult.confidence) / 2
        };
    }

    detectDoubleCircle(mouseHistory) {
        if (mouseHistory.length < 8) return { matches: false };

        // Two consecutive circles
        const firstCircle = this.detectCircleInHistory(mouseHistory.slice(0, 6));
        const secondCircle = this.detectCircleInHistory(mouseHistory.slice(4));

        return {
            matches: firstCircle.matches && secondCircle.matches,
            circles: [firstCircle, secondCircle],
            confidence: Math.min(firstCircle.confidence, secondCircle.confidence)
        };
    }

    detectFineAdjustment(mouseHistory) {
        if (mouseHistory.length < 4) return { matches: false };

        // Small circle followed by precise movement
        const smallCircle = this.detectSmallCircle(mouseHistory.slice(0, 3));
        const preciseMovement = this.detectPreciseMovement(mouseHistory.slice(2));

        return {
            matches: smallCircle.matches && preciseMovement.matches,
            mode: 'fine',
            circle: smallCircle,
            movement: preciseMovement,
            confidence: 0.85
        };
    }

    /**
     * 🎪 GESTURE HANDLERS
     */
    handleQuickInput(data) {
        console.info('⚡ Quick input activation');

        const input = data.result.input;
        if (input) {
            this.activateQuickInput(input);
            this.showInputHelper(input);
        }

        this.trackPropertyGesture('quick_input', data);
    }

    handleToggleSection(data) {
        console.info('📂 Toggle property section');

        const sectionHeader = this.getSectionHeaderAtPosition(data.result.center);
        if (sectionHeader) {
            this.togglePropertySection(sectionHeader);
        }

        this.trackPropertyGesture('toggle_section', data);
    }

    handleColorWheelSelect(data) {
        console.info('🎨 Color wheel selection');

        const colorPicker = this.getColorPickerAtPosition(data.result.center);
        if (colorPicker) {
            const color = this.calculateColorFromPosition(data.result.center, colorPicker);
            this.setSelectedColor(color);
        }

        this.trackPropertyGesture('color_wheel_select', data);
    }

    handleAdjustNumericValue(data) {
        console.info('🔢 Numeric value adjustment');

        const input = this.getNumericInputAtPosition(data.result.startPoint);
        const direction = data.result.direction;
        
        if (input) {
            const increment = direction === 'up' ? 1 : -1;
            this.adjustNumericInput(input, increment);
        }

        this.trackPropertyGesture('adjust_numeric', data);
    }

    handleEnterMultiEdit(data) {
        console.info('📋 Enter multi-edit mode');

        this.multiEditMode = true;
        this.showMultiEditUI();
        this.highlightCommonProperties();

        this.trackPropertyGesture('enter_multi_edit', data);
    }

    handleSyncValues(data) {
        console.info('🔄 Sync values across selection');

        if (this.multiEditMode) {
            this.syncPropertiesAcrossSelection();
            this.showSyncConfirmation();
        }

        this.trackPropertyGesture('sync_values', data);
    }

    handlePropertySearch(data) {
        console.info('🔍 Property search activation');

        this.activatePropertySearch();
        this.showSearchInterface();

        this.trackPropertyGesture('property_search', data);
    }

    /**
     * 🔧 UTILITY METHODS
     */
    isMouseOnInput() {
        return !!document.querySelector('input:hover, textarea:hover, select:hover');
    }

    isMouseOnSectionHeader() {
        return !!document.querySelector('.property-section-header:hover, .property-group-header:hover');
    }

    isMouseOnForm() {
        return this.propertiesPanel?.matches(':hover') || false;
    }

    isMouseOnColorPicker() {
        return !!document.querySelector('.color-picker:hover, .color-wheel:hover');
    }

    isMouseOnColorPalette() {
        return !!document.querySelector('.color-palette:hover, .color-grid:hover');
    }

    isMouseOnGradient() {
        return !!document.querySelector('.color-gradient:hover, .gradient-slider:hover');
    }

    isMouseOnNumericInput() {
        const input = document.querySelector('input[type="number"]:hover, .numeric-input:hover');
        return !!input;
    }

    isMouseOnSlider() {
        return !!document.querySelector('input[type="range"]:hover, .slider:hover');
    }

    isMultiSelectMode() {
        return window.canvasSelectionManager?.getSelectedComponents().length > 1 || false;
    }

    hasFormValues() {
        const inputs = this.propertiesPanel?.querySelectorAll('input, textarea, select') || [];
        return Array.from(inputs).some(input => input.value !== '');
    }

    hasMultipleSelectedComponents() {
        return this.isMultiSelectMode();
    }

    hasMultiplePropertyGroups() {
        return this.propertiesPanel?.querySelectorAll('.property-group, .property-section').length > 1;
    }

    getInputAtPosition(position) {
        const element = document.elementFromPoint(position.x, position.y);
        return element?.closest('input, textarea, select');
    }

    getColorAtPosition(position) {
        const element = document.elementFromPoint(position.x, position.y);
        return element?.closest('.color-swatch, .color-option');
    }

    activateQuickInput(input) {
        input.focus();
        input.select();
        
        // Show input suggestions if available
        this.showInputSuggestions(input);
    }

    showInputHelper(input) {
        const helper = document.createElement('div');
        helper.className = 'hmi-input-helper';
        helper.textContent = 'Quick input activated - type your value';
        
        helper.style.cssText = `
            position: absolute;
            top: -30px;
            left: 0;
            background: rgba(0,100,255,0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        input.style.position = 'relative';
        input.parentElement.appendChild(helper);
        
        setTimeout(() => helper.remove(), 2000);
    }

    togglePropertySection(sectionHeader) {
        const section = sectionHeader.nextElementSibling;
        if (section) {
            section.style.display = section.style.display === 'none' ? '' : 'none';
            sectionHeader.classList.toggle('collapsed');
        }
    }

    showMultiEditUI() {
        // Add multi-edit indicators to the UI
        this.propertiesPanel?.classList.add('multi-edit-mode');
        
        const indicator = document.createElement('div');
        indicator.className = 'hmi-multi-edit-indicator';
        indicator.textContent = 'Multi-Edit Mode Active';
        indicator.style.cssText = `
            position: sticky;
            top: 0;
            background: rgba(255,165,0,0.9);
            color: white;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            z-index: 100;
        `;
        
        this.propertiesPanel?.prepend(indicator);
    }

    adjustNumericInput(input, increment) {
        const currentValue = parseFloat(input.value) || 0;
        const step = parseFloat(input.step) || 1;
        const newValue = currentValue + (increment * step);
        
        // Respect min/max constraints
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        
        let finalValue = newValue;
        if (!isNaN(min)) finalValue = Math.max(min, finalValue);
        if (!isNaN(max)) finalValue = Math.min(max, finalValue);
        
        input.value = finalValue;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    trackPropertyGesture(gestureName, data) {
        console.info(`🔧 Property gesture: ${gestureName}`, data.result);
        
        // Track for analytics
        if (window.analyticsManager) {
            window.analyticsManager.trackPropertyGesture(gestureName, data);
        }
    }

    /**
     * 📊 CONTEXT OVERRIDES
     */
    isElementInContext(element) {
        return this.propertiesPanel?.contains(element) || false;
    }

    getContextElements() {
        const elements = [this.propertiesPanel];
        
        const formElements = this.propertiesPanel?.querySelectorAll(
            'input, textarea, select, button, .color-picker, .slider'
        ) || [];
        
        elements.push(...Array.from(formElements));
        return elements.filter(el => el);
    }

    getContextMetrics() {
        return {
            ...super.getContextMetrics(),
            multiEditMode: this.multiEditMode,
            formElementCount: this.getContextElements().length - 1,
            hasPropertyGroups: this.hasMultiplePropertyGroups(),
            propertiesPanelFound: !!this.propertiesPanel
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.multiEditMode = false;
        this.gestureQueue = [];
        this.formElements.clear();
        
        // Remove multi-edit UI
        document.querySelectorAll('.hmi-multi-edit-indicator').forEach(el => el.remove());
        this.propertiesPanel?.classList.remove('multi-edit-mode');
        
        super.destroy();
    }
}

export default PropertiesRegistry;
