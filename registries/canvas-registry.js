/**
 * CANVAS REGISTRY - SVG Canvas Gesture Detection
 * Specialized gestures for Digital Twin canvas operations
 */

import { BaseRegistry } from './base-registry.js';

export class CanvasRegistry extends BaseRegistry {
    constructor(hmiSystem) {
        super(hmiSystem, 'canvas');
        
        this.canvasElement = null;
        this.selectedComponents = new Set();
        this.lastGesturePosition = { x: 0, y: 0 };
        this.gestureHistory = [];
    }

    /**
     * 🎯 CANVAS-SPECIFIC GESTURE SETUP
     */
    async setupGestures() {
        // Find canvas element
        this.canvasElement = document.getElementById('svg-canvas') || 
                           document.querySelector('svg') ||
                           document.querySelector('.canvas-container');
        
        if (!this.canvasElement) {
            console.warn('⚠️ Canvas element not found');
            return;
        }

        console.info(`🎨 Setting up canvas gestures for:`, this.canvasElement);

        // 1. COMPONENT SELECTION GESTURES
        this.setupSelectionGestures();
        
        // 2. COMPONENT MANIPULATION GESTURES  
        this.setupManipulationGestures();
        
        // 3. DRAWING/CREATION GESTURES
        this.setupDrawingGestures();
        
        // 4. NAVIGATION GESTURES
        this.setupNavigationGestures();
        
        // 5. WORKFLOW GESTURES
        this.setupWorkflowGestures();
    }

    /**
     * 🎯 SELECTION GESTURES
     */
    setupSelectionGestures() {
        // Circle selection (lasso)
        this.registerGesture('lasso_select', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectLassoSelection(mouseHistory)
            },
            handler: this.handleLassoSelection,
            conditions: [() => this.isMouseOnCanvas()],
            cooldown: 200
        });

        // Multi-select with zigzag
        this.registerGesture('zigzag_multiselect', {
            pattern: {
                type: 'mouse_zigzag',
                minPoints: 6,
                amplitude: 25
            },
            handler: this.handleZigzagMultiSelect,
            conditions: [() => this.hasComponents()],
            cooldown: 300
        });

        // Rectangle selection
        this.registerGesture('rectangle_select', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectRectangleSelection(mouseHistory)
            },
            handler: this.handleRectangleSelection,
            cooldown: 150
        });
    }

    /**
     * 🎪 MANIPULATION GESTURES
     */
    setupManipulationGestures() {
        // Circle delete on selected components
        this.registerGesture('circle_delete', {
            pattern: {
                type: 'mouse_circle',
                radius: 60,
                tolerance: 0.4
            },
            handler: this.handleCircleDelete,
            conditions: [() => this.hasSelectedComponents()],
            cooldown: 500
        });

        // Component rotation (small circle on component)
        this.registerGesture('component_rotate', {
            pattern: {
                type: 'mouse_circle',
                radius: 30,
                tolerance: 0.6
            },
            handler: this.handleComponentRotate,
            conditions: [() => this.hasSelectedComponents() && this.selectedComponents.size === 1],
            cooldown: 100
        });

        // Component resize (diagonal swipe)
        this.registerGesture('component_resize', {
            pattern: {
                type: 'swipe',
                direction: null, // Any direction
                minDistance: 60,
                maxTime: 800
            },
            handler: this.handleComponentResize,
            conditions: [() => this.hasSelectedComponents()],
            cooldown: 50
        });

        // Component move (line gesture)
        this.registerGesture('component_move', {
            pattern: {
                type: 'mouse_line',
                minLength: 40,
                maxDeviation: 15
            },
            handler: this.handleComponentMove,
            conditions: [() => this.hasSelectedComponents()],
            cooldown: 50
        });
    }

    /**
     * 🎨 DRAWING GESTURES
     */
    setupDrawingGestures() {
        // Quick component creation (double tap + swipe)
        this.registerGesture('quick_create', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectQuickCreate(mouseHistory)
            },
            handler: this.handleQuickCreate,
            cooldown: 300
        });

        // Connection drawing (long line between components)
        this.registerGesture('draw_connection', {
            pattern: {
                type: 'mouse_line',
                minLength: 100,
                maxDeviation: 20
            },
            handler: this.handleDrawConnection,
            conditions: [() => this.isConnectionMode()],
            cooldown: 200
        });
    }

    /**
     * 🧭 NAVIGATION GESTURES
     */
    setupNavigationGestures() {
        // Pan canvas (swipe with multiple touches or middle mouse)
        this.registerGesture('pan_canvas', {
            pattern: {
                type: 'swipe',
                direction: null,
                minDistance: 80,
                maxTime: 1000
            },
            handler: this.handleCanvasPan,
            conditions: [() => this.isPanMode()],
            cooldown: 0 // Allow continuous panning
        });

        // Zoom in/out (pinch or circle)
        this.registerGesture('zoom_canvas', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory, touchHistory) => this.detectZoomGesture(mouseHistory, touchHistory)
            },
            handler: this.handleCanvasZoom,
            cooldown: 50
        });
    }

    /**
     * 🔄 WORKFLOW GESTURES
     */
    setupWorkflowGestures() {
        // Complete component workflow (drag → place → configure)
        this.registerGesture('complete_workflow', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectWorkflowCompletion(mouseHistory)
            },
            handler: this.handleWorkflowCompletion,
            cooldown: 1000
        });

        // Export gesture (circle + swipe up)
        this.registerGesture('export_gesture', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectExportGesture(mouseHistory)
            },
            handler: this.handleExportGesture,
            conditions: [() => this.hasComponents()],
            cooldown: 2000
        });
    }

    /**
     * 🎯 GESTURE DETECTION ALGORITHMS
     */
    detectLassoSelection(mouseHistory) {
        if (mouseHistory.length < 10) return { matches: false };

        // Check if path encloses area and has components inside
        const path = mouseHistory.map(p => ({ x: p.x, y: p.y }));
        const boundingBox = this.calculateBoundingBox(path);
        const componentsInBox = this.getComponentsInArea(boundingBox);
        
        // Check if path is roughly closed (start and end close)
        const start = path[0];
        const end = path[path.length - 1];
        const distance = Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2);
        const isClosed = distance < 50;
        
        return {
            matches: isClosed && componentsInBox.length > 0,
            components: componentsInBox,
            path,
            boundingBox,
            confidence: Math.min(componentsInBox.length / 3, 1)
        };
    }

    detectRectangleSelection(mouseHistory) {
        if (mouseHistory.length < 4) return { matches: false };

        const start = mouseHistory[0];
        const end = mouseHistory[mouseHistory.length - 1];
        
        // Check if it's a rectangular path
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        
        if (width < 30 || height < 30) return { matches: false };
        
        const boundingBox = {
            left: Math.min(start.x, end.x),
            right: Math.max(start.x, end.x),
            top: Math.min(start.y, end.y),
            bottom: Math.max(start.y, end.y)
        };
        
        const components = this.getComponentsInArea(boundingBox);
        
        return {
            matches: components.length > 0,
            boundingBox,
            components,
            confidence: 0.9
        };
    }

    detectQuickCreate(mouseHistory) {
        // Double tap followed by swipe pattern
        if (mouseHistory.length < 3) return { matches: false };
        
        // Look for quick tap-tap-swipe pattern
        const taps = this.findTapSequence(mouseHistory);
        const swipe = this.findSwipeAfterTaps(mouseHistory, taps);
        
        return {
            matches: taps.length >= 2 && swipe,
            taps,
            swipe,
            createPosition: taps[0]
        };
    }

    detectZoomGesture(mouseHistory, touchHistory) {
        // Pinch zoom detection
        if (touchHistory.length === 2) {
            return this.detectPinchZoom(touchHistory);
        }
        
        // Mouse wheel zoom or circle zoom
        if (mouseHistory.length > 5) {
            return this.detectCircleZoom(mouseHistory);
        }
        
        return { matches: false };
    }

    /**
     * 🎪 GESTURE HANDLERS
     */
    handleLassoSelection(data) {
        console.info('🎯 Lasso selection:', data.result.components.length, 'components');
        
        this.selectedComponents.clear();
        data.result.components.forEach(comp => this.selectedComponents.add(comp));
        
        this.updateSelectionUI();
        this.trackGesture('lasso_select', data);
    }

    handleZigzagMultiSelect(data) {
        console.info('⚡ Zigzag multi-select');
        
        // Get components along zigzag path
        const components = this.getComponentsAlongPath(data.result.path);
        components.forEach(comp => this.selectedComponents.add(comp));
        
        this.updateSelectionUI();
        this.trackGesture('zigzag_multiselect', data);
    }

    handleCircleDelete(data) {
        console.info('🗑️ Circle delete gesture');
        
        if (this.selectedComponents.size > 0) {
            this.deleteSelectedComponents();
            this.showGestureConfirmation('Components deleted', data.result.center);
        }
        
        this.trackGesture('circle_delete', data);
    }

    handleComponentRotate(data) {
        console.info('🔄 Component rotation');
        
        const [component] = Array.from(this.selectedComponents);
        if (component) {
            const rotationAngle = this.calculateRotationFromCircle(data.result);
            this.rotateComponent(component, rotationAngle);
        }
        
        this.trackGesture('component_rotate', data);
    }

    handleComponentMove(data) {
        console.info('📏 Component move');
        
        const moveVector = {
            x: data.result.endPoint.x - data.result.startPoint.x,
            y: data.result.endPoint.y - data.result.startPoint.y
        };
        
        this.selectedComponents.forEach(comp => {
            this.moveComponent(comp, moveVector);
        });
        
        this.trackGesture('component_move', data);
    }

    handleCanvasZoom(data) {
        console.info('🔍 Canvas zoom:', data.result.scale || data.result.direction);
        
        if (window.canvasZoomManager) {
            const zoomDelta = data.result.scale ? (data.result.scale - 1) * 0.5 : 0.1;
            window.canvasZoomManager.zoomBy(zoomDelta);
        }
        
        this.trackGesture('zoom_canvas', data);
    }

    /**
     * 🔧 UTILITY METHODS
     */
    isMouseOnCanvas() {
        return this.canvasElement && this.canvasElement.matches(':hover');
    }

    hasComponents() {
        return document.querySelectorAll('.draggable-component').length > 0;
    }

    hasSelectedComponents() {
        return this.selectedComponents.size > 0;
    }

    isConnectionMode() {
        return window.connectionManager?.isConnectionMode || false;
    }

    isPanMode() {
        return window.canvasPanMode || false;
    }

    calculateBoundingBox(path) {
        const xs = path.map(p => p.x);
        const ys = path.map(p => p.y);
        return {
            left: Math.min(...xs),
            right: Math.max(...xs),
            top: Math.min(...ys),
            bottom: Math.max(...ys)
        };
    }

    getComponentsInArea(boundingBox) {
        const components = Array.from(document.querySelectorAll('.draggable-component'));
        return components.filter(comp => {
            const rect = comp.getBoundingClientRect();
            const canvasRect = this.canvasElement.getBoundingClientRect();
            
            const compX = rect.left - canvasRect.left;
            const compY = rect.top - canvasRect.top;
            
            return compX >= boundingBox.left && 
                   compX <= boundingBox.right &&
                   compY >= boundingBox.top && 
                   compY <= boundingBox.bottom;
        });
    }

    updateSelectionUI() {
        // Update visual selection indicators
        document.querySelectorAll('.draggable-component').forEach(comp => {
            comp.classList.toggle('hmi-selected', this.selectedComponents.has(comp));
        });
        
        // Notify other systems
        if (window.canvasSelectionManager) {
            window.canvasSelectionManager.setSelection(Array.from(this.selectedComponents));
        }
    }

    deleteSelectedComponents() {
        this.selectedComponents.forEach(comp => {
            const componentId = comp.dataset.id;
            if (componentId && window.componentManager) {
                window.componentManager.removeComponent(componentId);
            }
        });
        this.selectedComponents.clear();
    }

    showGestureConfirmation(message, position) {
        const popup = document.createElement('div');
        popup.className = 'hmi-gesture-confirmation';
        popup.textContent = message;
        popup.style.cssText = `
            position: fixed;
            left: ${position.x}px;
            top: ${position.y}px;
            background: rgba(0,255,0,0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            pointer-events: none;
            z-index: 10000;
            animation: fadeOut 2s forwards;
        `;

        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 2000);
    }

    trackGesture(gestureName, data) {
        this.gestureHistory.push({
            name: gestureName,
            timestamp: data.timestamp,
            position: this.lastGesturePosition,
            result: data.result
        });
        
        // Limit history
        if (this.gestureHistory.length > 50) {
            this.gestureHistory.shift();
        }
    }

    /**
     * 📊 CONTEXT OVERRIDES
     */
    isElementInContext(element) {
        return this.canvasElement?.contains(element) || false;
    }

    getContextElements() {
        return [this.canvasElement, ...document.querySelectorAll('.draggable-component')];
    }

    getContextMetrics() {
        return {
            ...super.getContextMetrics(),
            selectedComponents: this.selectedComponents.size,
            totalComponents: document.querySelectorAll('.draggable-component').length,
            gestureHistory: this.gestureHistory.length,
            canvasFound: !!this.canvasElement
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.selectedComponents.clear();
        this.gestureHistory = [];
        super.destroy();
    }
}

export default CanvasRegistry;
