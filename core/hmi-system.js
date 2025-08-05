/**
 * HMI SYSTEM - Core Native JS Gesture & Event Detection
 * 
 * NATIVE JS FEATURES:
 * ✅ Proxy-based dynamic detection
 * ✅ Symbol private properties  
 * ✅ WeakMap metadata storage
 * ✅ Generator sequences
 * ✅ RAF performance optimization
 * ✅ Modular registry system
 */

import { NativeGestureDetector } from './gesture-detector.js';
import { EventRegistry } from './event-registry.js';
import { PatternMatcher } from './pattern-matcher.js';
import { PerformanceMonitor } from './performance-monitor.js';

// Private symbols
const PRIVATE = Symbol('hmi-private');
const REGISTRIES = Symbol('registries');
const STATE = Symbol('state');

/**
 * Main HMI System - orchestrates all components
 */
export class HMISystem {
    constructor(options = {}) {
        this[PRIVATE] = {
            target: options.target || document,
            gestureDetector: null,
            eventRegistry: null,
            patternMatcher: null,
            performanceMonitor: null,
            rafId: null,
            initialized: false
        };

        this[REGISTRIES] = new Map();
        this[STATE] = {
            activeContext: 'global',
            debugMode: false,
            detectionActive: false,
            metrics: {
                gesturesDetected: 0,
                lastGesture: null,
                avgResponseTime: 0
            }
        };

        // Proxy for dynamic method creation
        return new Proxy(this, {
            get(target, prop) {
                // Dynamic detection methods: detectSwipeLeft, detectCircle, etc.
                if (prop.startsWith('detect') && typeof target[prop] !== 'function') {
                    return target.createDynamicDetector(prop);
                }
                return target[prop];
            }
        });
    }

    /**
     * 🚀 SYSTEM INITIALIZATION
     */
    async init(options = {}) {
        if (this[PRIVATE].initialized) {
            console.warn('HMI System already initialized');
            return;
        }

        const startTime = performance.now();
        console.info('🎮 Initializing HMI System...');

        try {
            // Initialize core components
            await this.initializeCoreComponents(options);
            
            // Setup global event handlers
            this.setupGlobalHandlers();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            this[PRIVATE].initialized = true;
            
            const initTime = performance.now() - startTime;
            console.info(`✅ HMI System initialized in ${initTime.toFixed(2)}ms`);
            
            // Global access for debugging
            if (options.exposeGlobally !== false) {
                window.hmiSystem = this;
            }

            return true;
        } catch (error) {
            console.error('❌ HMI System initialization failed:', error);
            throw error;
        }
    }

    /**
     * 🏗️ CORE COMPONENTS INITIALIZATION
     */
    async initializeCoreComponents(options) {
        const { target } = this[PRIVATE];

        // Gesture Detector
        this[PRIVATE].gestureDetector = new NativeGestureDetector(target);
        
        // Event Registry
        this[PRIVATE].eventRegistry = new EventRegistry({
            hmiSystem: this,
            maxEvents: options.maxEvents || 1000
        });
        
        // Pattern Matcher
        this[PRIVATE].patternMatcher = new PatternMatcher({
            tolerance: options.tolerance || 0.3,
            performanceMode: options.performanceMode || false
        });
        
        // Performance Monitor
        this[PRIVATE].performanceMonitor = new PerformanceMonitor({
            sampleRate: options.sampleRate || 60,
            alertThreshold: options.alertThreshold || 30
        });

        console.info('🧩 Core components initialized');
    }

    /**
     * 🎯 FLUENT GESTURE API
     */
    gesture(name) {
        return this[PRIVATE].gestureDetector.gesture(name);
    }

    /**
     * 🎪 DYNAMIC DETECTOR CREATION (Proxy magic)
     */
    createDynamicDetector(methodName) {
        const patternType = methodName.replace('detect', '').toLowerCase();
        
        return (options = {}) => {
            const detector = this[PRIVATE].gestureDetector.createDynamicDetector(methodName);
            return detector(options);
        };
    }

    /**
     * 📋 REGISTRY MANAGEMENT
     */
    registerRegistry(name, registryInstance) {
        if (this[REGISTRIES].has(name)) {
            console.warn(`Registry ${name} already exists. Replacing...`);
        }

        this[REGISTRIES].set(name, registryInstance);
        
        // Auto-initialize if system is ready
        if (this[PRIVATE].initialized) {
            registryInstance.init();
        }

        console.info(`📋 Registry registered: ${name}`);
        return this;
    }

    /**
     * 🎯 CONTEXT SWITCHING
     */
    setActiveContext(contextName) {
        if (!this[REGISTRIES].has(contextName)) {
            console.warn(`Context ${contextName} not found`);
            return false;
        }

        const previousContext = this[STATE].activeContext;
        this[STATE].activeContext = contextName;

        // Deactivate previous context
        if (this[REGISTRIES].has(previousContext)) {
            this[REGISTRIES].get(previousContext).deactivate?.();
        }

        // Activate new context
        const newRegistry = this[REGISTRIES].get(contextName);
        newRegistry.activate?.();

        console.info(`🎯 Context switched: ${previousContext} → ${contextName}`);
        
        // Dispatch context change event
        this.dispatchEvent('context-changed', {
            previous: previousContext,
            current: contextName,
            registry: newRegistry
        });

        return true;
    }

    /**
     * ▶️ START DETECTION
     */
    startDetection(contextName = null) {
        if (this[STATE].detectionActive) {
            console.warn('Detection already active');
            return;
        }

        // Start gesture detection
        this[PRIVATE].gestureDetector.startDetection();
        
        // Activate specific context or all registries
        if (contextName) {
            this.setActiveContext(contextName);
        } else {
            // Activate all registries
            this[REGISTRIES].forEach(registry => registry.activate?.());
        }

        this[STATE].detectionActive = true;
        console.info('▶️ HMI Detection started');

        return {
            stop: () => this.stopDetection(),
            pause: () => this.pauseDetection(),
            resume: () => this.resumeDetection()
        };
    }

    /**
     * ⏹️ STOP DETECTION
     */
    stopDetection() {
        if (!this[STATE].detectionActive) return;

        this[PRIVATE].gestureDetector.stopDetection();
        this[REGISTRIES].forEach(registry => registry.deactivate?.());
        this[STATE].detectionActive = false;

        console.info('⏹️ HMI Detection stopped');
    }

    /**
     * ⏸️ PAUSE/RESUME DETECTION
     */
    pauseDetection() {
        this[PRIVATE].gestureDetector.pauseDetection();
        console.info('⏸️ HMI Detection paused');
    }

    resumeDetection() {
        this[PRIVATE].gestureDetector.resumeDetection();
        console.info('▶️ HMI Detection resumed');
    }

    /**
     * 📊 PERFORMANCE MONITORING
     */
    startPerformanceMonitoring() {
        const monitor = () => {
            const metrics = this[PRIVATE].performanceMonitor.getMetrics();
            
            // Update state metrics
            Object.assign(this[STATE].metrics, metrics);
            
            // Check for performance issues
            if (metrics.fps < 30) {
                this.handlePerformanceIssue(metrics);
            }

            this[PRIVATE].rafId = requestAnimationFrame(monitor);
        };

        monitor();
        console.info('📊 Performance monitoring started');
    }

    /**
     * ⚠️ PERFORMANCE ISSUE HANDLING
     */
    handlePerformanceIssue(metrics) {
        console.warn('⚠️ Performance issue detected:', metrics);
        
        // Auto-optimization strategies
        if (metrics.fps < 20) {
            // Emergency mode: reduce detection frequency
            this[PRIVATE].gestureDetector.setPerformanceMode(true);
            console.info('🚨 Emergency performance mode activated');
        }

        // Dispatch performance event
        this.dispatchEvent('performance-issue', { metrics });
    }

    /**
     * 🛠️ DEBUG MODE
     */
    enableDebugMode() {
        this[STATE].debugMode = true;
        
        // Enhanced logging
        this.on('gesture-detected', (data) => {
            console.log(`🎯 Gesture [${data.name}]:`, data.result);
        });

        this.on('pattern-matched', (data) => {
            console.log(`🎪 Pattern [${data.pattern}]:`, data);
        });

        // Global debug functions
        window.hmiDebug = {
            getState: () => this[STATE],
            getMetrics: () => this.getPerformanceMetrics(),
            listRegistries: () => Array.from(this[REGISTRIES].keys()),
            switchContext: (name) => this.setActiveContext(name),
            toggleDetection: () => {
                if (this[STATE].detectionActive) {
                    this.stopDetection();
                } else {
                    this.startDetection();
                }
            }
        };

        console.info('🛠️ Debug mode enabled. Use window.hmiDebug for controls');
    }

    /**
     * 📈 METRICS & ANALYTICS
     */
    getPerformanceMetrics() {
        return {
            ...this[STATE].metrics,
            systemMetrics: this[PRIVATE].performanceMonitor.getMetrics(),
            gestureMetrics: this[PRIVATE].gestureDetector.getPerformanceMetrics?.(),
            registryCount: this[REGISTRIES].size,
            activeContext: this[STATE].activeContext,
            detectionActive: this[STATE].detectionActive
        };
    }

    /**
     * 📤 EVENT SYSTEM
     */
    on(eventName, handler) {
        return this[PRIVATE].eventRegistry.on(eventName, handler);
    }

    off(eventName, handler) {
        return this[PRIVATE].eventRegistry.off(eventName, handler);
    }

    dispatchEvent(eventName, data) {
        return this[PRIVATE].eventRegistry.dispatch(eventName, data);
    }

    /**
     * 🌐 GLOBAL EVENT HANDLERS
     */
    setupGlobalHandlers() {
        const { target } = this[PRIVATE];

        // Global keyboard shortcuts
        target.addEventListener('keydown', (e) => {
            // Ctrl+Shift+H = Toggle HMI debug
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                this.enableDebugMode();
                e.preventDefault();
            }
            
            // Ctrl+Shift+P = Performance report
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                console.table(this.getPerformanceMetrics());
                e.preventDefault();
            }
        });

        // Global gesture events forwarding
        target.addEventListener('gesturedetected', (e) => {
            this.handleGestureDetected(e.detail);
        });

        console.info('🌐 Global handlers setup complete');
    }

    /**
     * 🎯 GESTURE EVENT HANDLING
     */
    handleGestureDetected(gestureData) {
        this[STATE].metrics.gesturesDetected++;
        this[STATE].metrics.lastGesture = {
            name: gestureData.name,
            timestamp: gestureData.timestamp,
            context: this[STATE].activeContext
        };

        // Forward to active registry
        const activeRegistry = this[REGISTRIES].get(this[STATE].activeContext);
        if (activeRegistry && activeRegistry.handleGesture) {
            activeRegistry.handleGesture(gestureData);
        }

        // Dispatch to system listeners
        this.dispatchEvent('gesture-detected', gestureData);
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        console.info('🧹 Destroying HMI System...');

        // Stop detection
        this.stopDetection();

        // Cancel RAF
        if (this[PRIVATE].rafId) {
            cancelAnimationFrame(this[PRIVATE].rafId);
        }

        // Destroy core components
        this[PRIVATE].gestureDetector?.destroy();
        this[PRIVATE].eventRegistry?.destroy();
        this[PRIVATE].performanceMonitor?.destroy();

        // Clear registries
        this[REGISTRIES].forEach(registry => registry.destroy?.());
        this[REGISTRIES].clear();

        // Clear global references
        delete window.hmiSystem;
        delete window.hmiDebug;

        this[PRIVATE].initialized = false;
        console.info('✅ HMI System destroyed');
    }
}

/**
 * 🏭 FACTORY FUNCTION
 */
export function createHMISystem(options = {}) {
    return new HMISystem(options);
}

export default HMISystem;
