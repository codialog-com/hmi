/**
 * BASIC HMI INTEGRATION EXAMPLE
 * Complete integration guide for Digital Twin PWA
 * 
 * Shows how to replace traditional event listeners with HMI registry system
 */

import { HMISystem } from '../core/hmi-system.js';
import { CanvasRegistry } from '../registries/canvas-registry.js';
import { SidebarRegistry } from '../registries/sidebar-registry.js';
import { PropertiesRegistry } from '../registries/properties-registry.js';
import { WorkflowRegistry } from '../registries/workflow-registry.js';
import { GlobalRegistry } from '../registries/global-registry.js';

/**
 * 🎯 BASIC INTEGRATION EXAMPLE
 */
export class HMIIntegrationExample {
    constructor() {
        this.hmiSystem = null;
        this.registries = new Map();
        this.initialized = false;
    }

    /**
     * 🚀 STEP 1: Initialize HMI System
     */
    async initializeHMI() {
        console.info('🚀 Step 1: Initializing HMI System...');

        // Create HMI system
        this.hmiSystem = new HMISystem({
            target: document,
            performanceMode: false,
            exposeGlobally: true
        });

        // Initialize core system
        await this.hmiSystem.init();

        console.info('✅ HMI System ready');
        return this.hmiSystem;
    }

    /**
     * 🏗️ STEP 2: Setup Context Registries
     */
    async setupRegistries() {
        console.info('🏗️ Step 2: Setting up context registries...');

        // Create all registries
        const registryClasses = [
            { name: 'canvas', class: CanvasRegistry },
            { name: 'sidebar', class: SidebarRegistry },
            { name: 'properties', class: PropertiesRegistry },
            { name: 'workflow', class: WorkflowRegistry },
            { name: 'global', class: GlobalRegistry }
        ];

        // Initialize each registry
        for (const { name, class: RegistryClass } of registryClasses) {
            try {
                const registry = new RegistryClass(this.hmiSystem);
                await registry.init();
                this.registries.set(name, registry);
                console.info(`✅ ${name} registry initialized`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${name} registry:`, error);
            }
        }

        console.info('✅ All registries setup complete');
        return this.registries;
    }

    /**
     * 🎯 STEP 3: Replace Traditional Event Listeners
     */
    replaceEventListeners() {
        console.info('🎯 Step 3: Replacing traditional event listeners...');

        // BEFORE: Traditional event listeners
        this.showTraditionalApproach();

        // AFTER: HMI-driven approach
        this.showHMIApproach();

        console.info('✅ Event listeners replaced with HMI system');
    }

    /**
     * 📝 BEFORE: Traditional Event Listeners
     */
    showTraditionalApproach() {
        console.info('📝 BEFORE - Traditional approach:');
        
        const traditionalCode = `
        // OLD WAY - Traditional event listeners
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportManager.exportProject();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') {
                this.deleteSelectedComponents();
            }
        });

        svgCanvas.addEventListener('mousedown', (e) => {
            this.startSelection(e);
        });

        // Problems: scattered, hard to manage, no gesture support
        `;

        console.info(traditionalCode);
    }

    /**
     * 🎯 AFTER: HMI-driven approach
     */
    showHMIApproach() {
        console.info('🎯 AFTER - HMI-driven approach:');

        // Global gestures (available everywhere)
        this.registries.get('global')?.registerGesture('app_save', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectSaveGesture(mouseHistory)
            },
            handler: () => {
                console.info('💾 Save gesture detected');
                window.exportManager?.quickSave();
            }
        });

        // Canvas-specific gestures
        this.registries.get('canvas')?.registerGesture('smart_delete', {
            pattern: {
                type: 'mouse_circle',
                radius: 50,
                tolerance: 0.4
            },
            handler: (data) => {
                console.info('🗑️ Smart delete via circle gesture');
                this.deleteComponentsInArea(data.result.center, data.result.radius);
            },
            conditions: [() => this.hasSelectedComponents()]
        });

        // Properties panel gestures
        this.registries.get('properties')?.registerGesture('quick_apply', {
            pattern: {
                type: 'swipe',
                direction: 'up',
                minDistance: 60
            },
            handler: () => {
                console.info('⚡ Quick apply all properties');
                this.applyAllProperties();
            }
        });

        console.info('✅ HMI gestures configured');
    }

    /**
     * 🎮 STEP 4: Start Detection
     */
    startGestureDetection() {
        console.info('🎮 Step 4: Starting gesture detection...');

        // Start with canvas context active
        this.hmiSystem.startDetection('canvas');

        // Setup context switching based on user focus
        this.setupContextSwitching();

        console.info('✅ Gesture detection active');
    }

    /**
     * 🔄 AUTOMATIC CONTEXT SWITCHING
     */
    setupContextSwitching() {
        // Auto-switch context based on mouse position
        document.addEventListener('mouseover', (e) => {
            const target = e.target;
            
            if (target.closest('.sidebar, .component-palette')) {
                this.hmiSystem.setActiveContext('sidebar');
            } else if (target.closest('.properties-panel')) {
                this.hmiSystem.setActiveContext('properties');
            } else if (target.closest('#svg-canvas, .canvas-container')) {
                this.hmiSystem.setActiveContext('canvas');
            }
        });

        console.info('🔄 Auto-context switching enabled');
    }

    /**
     * 📊 STEP 5: Monitor & Debug
     */
    setupMonitoring() {
        console.info('📊 Step 5: Setting up monitoring...');

        // Performance monitoring
        this.hmiSystem.on('performance-issue', (data) => {
            console.warn('⚠️ Performance issue:', data.detail);
            this.handlePerformanceIssue(data.detail);
        });

        // Gesture analytics
        this.hmiSystem.on('gesture-detected', (data) => {
            console.info(`🎯 Gesture: ${data.data.name}`, data.data.result);
            this.trackGestureUsage(data.data);
        });

        // Debug mode keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                this.toggleDebugMode();
                e.preventDefault();
            }
        });

        console.info('✅ Monitoring setup complete');
    }

    /**
     * 🎯 UTILITY METHODS
     */
    detectSaveGesture(mouseHistory) {
        // S-shaped gesture detection
        if (mouseHistory.length < 6) return { matches: false };
        
        // Simplified S detection
        const path = mouseHistory.map(p => ({ x: p.x, y: p.y }));
        const isSShape = this.analyzeSPattern(path);
        
        return {
            matches: isSShape.confidence > 0.7,
            confidence: isSShape.confidence
        };
    }

    analyzeSPattern(path) {
        // Simple S pattern analysis
        if (path.length < 6) return { confidence: 0 };
        
        const curves = this.findCurveDirections(path);
        const hasSCurves = curves.filter(c => c.type === 'curve').length >= 2;
        
        return {
            confidence: hasSCurves ? 0.8 : 0.3,
            curves
        };
    }

    findCurveDirections(path) {
        const curves = [];
        for (let i = 2; i < path.length; i++) {
            const prev = path[i - 2];
            const curr = path[i - 1];
            const next = path[i];
            
            const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
            const angleDiff = Math.abs(angle2 - angle1);
            
            if (angleDiff > Math.PI / 4) {
                curves.push({ type: 'curve', angle: angleDiff });
            }
        }
        return curves;
    }

    hasSelectedComponents() {
        return window.canvasSelectionManager?.getSelectedComponents().length > 0;
    }

    deleteComponentsInArea(center, radius) {
        const components = document.querySelectorAll('.draggable-component');
        const toDelete = Array.from(components).filter(comp => {
            const rect = comp.getBoundingClientRect();
            const compCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            const distance = Math.sqrt(
                (compCenter.x - center.x) ** 2 + (compCenter.y - center.y) ** 2
            );
            return distance <= radius;
        });

        toDelete.forEach(comp => {
            const id = comp.dataset.id;
            if (id && window.componentManager) {
                window.componentManager.removeComponent(id);
            }
        });

        console.info(`🗑️ Deleted ${toDelete.length} components in area`);
    }

    applyAllProperties() {
        // Apply all pending property changes
        if (window.propertiesManager) {
            window.propertiesManager.applyAllChanges?.();
        }
    }

    handlePerformanceIssue(metrics) {
        if (metrics.fps < 20) {
            console.warn('🚨 Critical performance issue - enabling emergency mode');
            this.hmiSystem.enableEmergencyMode?.();
        }
    }

    trackGestureUsage(gestureData) {
        // Track for analytics
        const usage = {
            gesture: gestureData.name,
            context: gestureData.context || 'unknown',
            timestamp: gestureData.timestamp,
            confidence: gestureData.result.confidence || 1
        };

        if (window.analyticsManager) {
            window.analyticsManager.trackGesture(usage);
        }
    }

    toggleDebugMode() {
        if (this.hmiSystem) {
            this.hmiSystem.enableDebugMode();
            console.info('🛠️ Debug mode toggled');
        }
    }

    /**
     * 📈 INTEGRATION METRICS
     */
    getIntegrationStatus() {
        return {
            hmiInitialized: !!this.hmiSystem,
            registriesCount: this.registries.size,
            activeContext: this.hmiSystem?.getActiveContext?.() || 'none',
            detectionActive: this.hmiSystem?.isDetectionActive?.() || false,
            registries: Array.from(this.registries.keys()),
            metrics: this.hmiSystem?.getPerformanceMetrics?.() || null
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        if (this.hmiSystem) {
            this.hmiSystem.destroy();
        }
        this.registries.clear();
        this.initialized = false;
        console.info('🧹 HMI Integration destroyed');
    }
}

/**
 * 🎯 COMPLETE INTEGRATION FUNCTION
 */
export async function integrateHMISystem() {
    console.info('🚀 Starting HMI Integration...');
    
    const integration = new HMIIntegrationExample();
    
    try {
        // Step-by-step integration
        await integration.initializeHMI();
        await integration.setupRegistries();
        integration.replaceEventListeners();
        integration.startGestureDetection();
        integration.setupMonitoring();
        
        console.info('✅ HMI Integration complete!');
        console.info('🎮 Try these gestures:');
        console.info('  • Circle on component = delete');
        console.info('  • S gesture = save');
        console.info('  • Swipe up in properties = apply all');
        console.info('  • Ctrl+Shift+H = debug mode');
        
        // Global access for testing
        window.hmiIntegration = integration;
        
        return integration;
        
    } catch (error) {
        console.error('❌ HMI Integration failed:', error);
        throw error;
    }
}

/**
 * 🎯 USAGE EXAMPLES
 */
export const usageExamples = {
    basicSetup: `
// Basic setup in your app.js
import { integrateHMISystem } from './hmi/examples/basic-integration.js';

// Replace your old init method
async init() {
    await this.initializeManagers();
    
    // NEW: Replace setupEventListeners with HMI
    const hmiIntegration = await integrateHMISystem();
    
    console.log('App ready with HMI gestures!');
}
`,

    customGestures: `
// Add custom gestures
hmiIntegration.registries.get('canvas').registerGesture('my_custom', {
    pattern: { type: 'custom', detectionFn: myDetector },
    handler: myHandler,
    conditions: [myCondition]
});
`,

    debugging: `
// Debug commands in console
window.hmiIntegration.getIntegrationStatus()
window.hmiSystem.getPerformanceMetrics()
window.hmiDebug.toggleDetection()
`
};

export default HMIIntegrationExample;
