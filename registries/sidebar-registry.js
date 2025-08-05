/**
 * SIDEBAR REGISTRY - Component Palette & Navigation Gestures
 * Specialized gestures for sidebar component interactions
 */

import { BaseRegistry } from './base-registry.js';

export class SidebarRegistry extends BaseRegistry {
    constructor(hmiSystem) {
        super(hmiSystem, 'sidebar');
        
        this.sidebarElement = null;
        this.componentPalette = null;
        this.navigationHistory = [];
        this.dragPreview = null;
    }

    /**
     * 🎯 SIDEBAR-SPECIFIC GESTURE SETUP
     */
    async setupGestures() {
        // Find sidebar elements
        this.sidebarElement = document.querySelector('.sidebar') || 
                            document.querySelector('#sidebar') ||
                            document.querySelector('.component-palette');
        
        this.componentPalette = document.querySelector('.components-list') ||
                              document.querySelector('.palette-container');

        if (!this.sidebarElement) {
            console.warn('⚠️ Sidebar element not found');
            return;
        }

        console.info(`🗂️ Setting up sidebar gestures for:`, this.sidebarElement);

        // 1. COMPONENT PALETTE GESTURES
        this.setupPaletteGestures();
        
        // 2. NAVIGATION GESTURES
        this.setupNavigationGestures();
        
        // 3. COMPONENT SELECTION GESTURES
        this.setupComponentSelectionGestures();
        
        // 4. DRAG PREVIEW GESTURES
        this.setupDragPreviewGestures();
    }

    /**
     * 🎨 PALETTE GESTURES
     */
    setupPaletteGestures() {
        // Quick component selection (double tap)
        this.registerGesture('quick_select_component', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectQuickSelect(mouseHistory)
            },
            handler: this.handleQuickSelectComponent,
            conditions: [() => this.isMouseOnPalette()],
            cooldown: 300
        });

        // Component preview (hover + circle)
        this.registerGesture('preview_component', {
            pattern: {
                type: 'mouse_circle',
                radius: 25,
                tolerance: 0.7
            },
            handler: this.handleComponentPreview,
            conditions: [() => this.isMouseOnComponent()],
            cooldown: 500
        });

        // Multi-component selection (zigzag over multiple items)
        this.registerGesture('multi_component_select', {
            pattern: {
                type: 'mouse_zigzag',
                minPoints: 4,
                amplitude: 20
            },
            handler: this.handleMultiComponentSelect,
            conditions: [() => this.isMouseOnPalette()],
            cooldown: 400
        });

        // Category switch (swipe up/down)
        this.registerGesture('switch_category', {
            pattern: {
                type: 'swipe',
                direction: null, // vertical swipes
                minDistance: 60,
                maxTime: 400
            },
            handler: this.handleCategorySwitch,
            conditions: [() => this.isMouseOnPalette() && this.hasCategories()],
            cooldown: 200
        });
    }

    /**
     * 🧭 NAVIGATION GESTURES
     */
    setupNavigationGestures() {
        // Sidebar collapse/expand (double swipe left/right)
        this.registerGesture('toggle_sidebar', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectSidebarToggle(mouseHistory)
            },
            handler: this.handleSidebarToggle,
            cooldown: 1000
        });

        // Search mode activation (circle + line up)
        this.registerGesture('activate_search', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectSearchActivation(mouseHistory)
            },
            handler: this.handleSearchActivation,
            conditions: [() => this.hasSearchFunction()],
            cooldown: 500
        });

        // Filter toggle (horizontal zigzag)
        this.registerGesture('toggle_filter', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectHorizontalZigzag(mouseHistory)
            },
            handler: this.handleFilterToggle,
            cooldown: 300
        });
    }

    /**
     * 🎯 COMPONENT SELECTION GESTURES
     */
    setupComponentSelectionGestures() {
        // Component info display (long press + circle)
        this.registerGesture('show_component_info', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectLongPressCircle(mouseHistory)
            },
            handler: this.handleShowComponentInfo,
            conditions: [() => this.isMouseOnComponent()],
            cooldown: 800
        });

        // Favorite component (star gesture)
        this.registerGesture('favorite_component', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectStarGesture(mouseHistory)
            },
            handler: this.handleFavoriteComponent,
            conditions: [() => this.isMouseOnComponent()],
            cooldown: 600
        });

        // Component history navigation (swipe left = back, right = forward)
        this.registerGesture('history_navigation', {
            pattern: {
                type: 'swipe',
                direction: null,
                minDistance: 80,
                maxTime: 300
            },
            handler: this.handleHistoryNavigation,
            conditions: [() => this.hasNavigationHistory()],
            cooldown: 150
        });
    }

    /**
     * 🖱️ DRAG PREVIEW GESTURES
     */
    setupDragPreviewGestures() {
        // Enhanced drag preview (circle before drag)
        this.registerGesture('enhanced_drag_preview', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectDragPreview(mouseHistory)
            },
            handler: this.handleEnhancedDragPreview,
            conditions: [() => this.isMouseOnComponent()],
            cooldown: 100
        });

        // Snap preview (line gesture to canvas)
        this.registerGesture('snap_preview', {
            pattern: {
                type: 'mouse_line',
                minLength: 100,
                maxDeviation: 30
            },
            handler: this.handleSnapPreview,
            conditions: [() => this.isDragging()],
            cooldown: 50
        });
    }

    /**
     * 🎯 DETECTION ALGORITHMS
     */
    detectQuickSelect(mouseHistory) {
        if (mouseHistory.length < 3) return { matches: false };

        // Look for quick double-tap pattern
        const taps = this.findTapSequence(mouseHistory, 200); // 200ms max between taps
        const componentElement = this.getComponentAtPosition(mouseHistory[0]);

        return {
            matches: taps.length >= 2 && componentElement,
            component: componentElement,
            taps,
            confidence: 0.9
        };
    }

    detectSidebarToggle(mouseHistory) {
        if (mouseHistory.length < 6) return { matches: false };

        // Look for double swipe pattern (left-right or right-left)
        const swipes = this.findSwipeSequence(mouseHistory);
        const isDoubleSwipe = swipes.length >= 2 && 
                             this.areSwipesOpposite(swipes[0], swipes[1]);

        return {
            matches: isDoubleSwipe,
            swipes,
            confidence: 0.8
        };
    }

    detectSearchActivation(mouseHistory) {
        if (mouseHistory.length < 8) return { matches: false };

        // Circle followed by upward line
        const circleResult = this.detectCircleInHistory(mouseHistory.slice(0, 6));
        const lineResult = this.detectUpwardLine(mouseHistory.slice(4));

        return {
            matches: circleResult.matches && lineResult.matches,
            circle: circleResult,
            line: lineResult,
            confidence: (circleResult.confidence + lineResult.confidence) / 2
        };
    }

    detectStarGesture(mouseHistory) {
        if (mouseHistory.length < 10) return { matches: false };

        // Star pattern: 5 lines forming a star
        const lines = this.findLineSegments(mouseHistory);
        const starPattern = this.analyzeStarPattern(lines);

        return {
            matches: starPattern.isStarLike,
            lines: starPattern.lines,
            confidence: starPattern.confidence
        };
    }

    detectHorizontalZigzag(mouseHistory) {
        if (mouseHistory.length < 6) return { matches: false };

        // Horizontal zigzag (more horizontal than vertical movement)
        const horizontalChanges = this.countHorizontalDirectionChanges(mouseHistory);
        const verticalChanges = this.countVerticalDirectionChanges(mouseHistory);

        return {
            matches: horizontalChanges >= 3 && horizontalChanges > verticalChanges,
            horizontalChanges,
            verticalChanges,
            confidence: Math.min(horizontalChanges / 5, 1)
        };
    }

    /**
     * 🎪 GESTURE HANDLERS
     */
    handleQuickSelectComponent(data) {
        console.info('⚡ Quick component selection:', data.result.component);

        const component = data.result.component;
        if (component) {
            this.selectComponent(component);
            this.addToNavigationHistory(component);
            this.showComponentHighlight(component);
        }

        this.trackSidebarGesture('quick_select', data);
    }

    handleComponentPreview(data) {
        console.info('👁️ Component preview');

        const mousePos = data.result.center;
        const component = this.getComponentAtPosition(mousePos);
        
        if (component) {
            this.showComponentPreview(component, mousePos);
        }

        this.trackSidebarGesture('preview', data);
    }

    handleMultiComponentSelect(data) {
        console.info('📋 Multi-component selection');

        const path = data.result.path || [];
        const components = this.getComponentsAlongPath(path);
        
        components.forEach(comp => this.selectComponent(comp, true)); // Multi-select mode
        this.showMultiSelectionUI(components);

        this.trackSidebarGesture('multi_select', data);
    }

    handleCategorySwitch(data) {
        const direction = data.result.direction;
        console.info('📂 Category switch:', direction);

        if (direction === 'up') {
            this.switchToPreviousCategory();
        } else if (direction === 'down') {
            this.switchToNextCategory();
        }

        this.trackSidebarGesture('category_switch', data);
    }

    handleSidebarToggle(data) {
        console.info('🔄 Sidebar toggle');

        this.toggleSidebarVisibility();
        this.trackSidebarGesture('sidebar_toggle', data);
    }

    handleSearchActivation(data) {
        console.info('🔍 Search activation');

        this.activateSearchMode();
        this.focusSearchInput();
        
        this.trackSidebarGesture('search_activation', data);
    }

    handleFavoriteComponent(data) {
        console.info('⭐ Favorite component');

        const mousePos = data.result.center || { x: 0, y: 0 };
        const component = this.getComponentAtPosition(mousePos);
        
        if (component) {
            this.toggleComponentFavorite(component);
            this.showFavoriteAnimation(component);
        }

        this.trackSidebarGesture('favorite', data);
    }

    /**
     * 🔧 UTILITY METHODS
     */
    isMouseOnPalette() {
        return this.componentPalette && 
               this.componentPalette.matches(':hover');
    }

    isMouseOnComponent() {
        const componentElements = this.sidebarElement?.querySelectorAll('.component-item, .palette-component');
        return Array.from(componentElements || []).some(el => el.matches(':hover'));
    }

    hasCategories() {
        return this.sidebarElement?.querySelectorAll('.category, .component-category').length > 1;
    }

    hasSearchFunction() {
        return !!this.sidebarElement?.querySelector('.search-input, #component-search');
    }

    hasNavigationHistory() {
        return this.navigationHistory.length > 0;
    }

    isDragging() {
        return !!this.dragPreview || document.querySelector('.dragging-preview');
    }

    getComponentAtPosition(position) {
        const element = document.elementFromPoint(position.x, position.y);
        return element?.closest('.component-item, .palette-component');
    }

    getComponentsAlongPath(path) {
        const components = new Set();
        
        path.forEach(point => {
            const component = this.getComponentAtPosition(point);
            if (component) components.add(component);
        });
        
        return Array.from(components);
    }

    selectComponent(component, multiSelect = false) {
        if (!multiSelect) {
            // Clear previous selections
            this.sidebarElement?.querySelectorAll('.selected').forEach(el => {
                el.classList.remove('selected');
            });
        }
        
        component.classList.add('selected');
        
        // Notify other systems
        const componentType = component.dataset.componentType || 
                            component.querySelector('.component-name')?.textContent;
        
        if (window.componentManager) {
            window.componentManager.selectComponentType(componentType);
        }
    }

    showComponentPreview(component, position) {
        // Remove existing preview
        document.querySelectorAll('.hmi-component-preview').forEach(el => el.remove());
        
        const preview = document.createElement('div');
        preview.className = 'hmi-component-preview';
        preview.innerHTML = `
            <div class="preview-content">
                <h4>${component.dataset.componentType || 'Component'}</h4>
                <p>${component.dataset.description || 'No description'}</p>
            </div>
        `;
        
        preview.style.cssText = `
            position: fixed;
            left: ${position.x + 10}px;
            top: ${position.y + 10}px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 10px;
            border-radius: 6px;
            pointer-events: none;
            z-index: 10000;
            animation: fadeIn 0.3s ease-in;
        `;
        
        document.body.appendChild(preview);
        
        // Auto-remove after delay
        setTimeout(() => preview.remove(), 3000);
    }

    toggleSidebarVisibility() {
        if (this.sidebarElement) {
            this.sidebarElement.classList.toggle('collapsed');
            
            // Notify layout system
            document.dispatchEvent(new CustomEvent('sidebar-toggled', {
                detail: { collapsed: this.sidebarElement.classList.contains('collapsed') }
            }));
        }
    }

    activateSearchMode() {
        const searchInput = this.sidebarElement?.querySelector('.search-input, #component-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    addToNavigationHistory(component) {
        this.navigationHistory.push({
            component,
            timestamp: performance.now(),
            type: component.dataset.componentType
        });
        
        // Limit history size
        if (this.navigationHistory.length > 20) {
            this.navigationHistory.shift();
        }
    }

    trackSidebarGesture(gestureName, data) {
        console.info(`🗂️ Sidebar gesture: ${gestureName}`, data.result);
        
        // Could integrate with analytics system
        if (window.analyticsManager) {
            window.analyticsManager.trackSidebarGesture(gestureName, data);
        }
    }

    /**
     * 📊 CONTEXT OVERRIDES
     */
    isElementInContext(element) {
        return this.sidebarElement?.contains(element) || false;
    }

    getContextElements() {
        const elements = [this.sidebarElement];
        if (this.componentPalette) elements.push(this.componentPalette);
        
        const componentItems = this.sidebarElement?.querySelectorAll('.component-item, .palette-component') || [];
        elements.push(...Array.from(componentItems));
        
        return elements.filter(el => el);
    }

    getContextMetrics() {
        return {
            ...super.getContextMetrics(),
            navigationHistory: this.navigationHistory.length,
            componentCount: this.getContextElements().length - 2, // Exclude sidebar and palette containers
            hasSearch: this.hasSearchFunction(),
            hasCategories: this.hasCategories(),
            sidebarFound: !!this.sidebarElement
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.navigationHistory = [];
        this.dragPreview = null;
        
        // Remove any preview elements
        document.querySelectorAll('.hmi-component-preview').forEach(el => el.remove());
        
        super.destroy();
    }
}

export default SidebarRegistry;
