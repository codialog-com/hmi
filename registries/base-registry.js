/**
 * BASE REGISTRY - Common functionality for all context registries
 * Provides foundation for canvas, sidebar, properties, workflow registries
 */

export class BaseRegistry {
    constructor(hmiSystem, contextName) {
        this.hmiSystem = hmiSystem;
        this.contextName = contextName;
        this.gestures = new Map();
        this.active = false;
        this.initialized = false;
        
        console.info(`📋 ${contextName} Registry created`);
    }

    /**
     * 🚀 INITIALIZATION
     */
    async init() {
        if (this.initialized) return;
        
        console.info(`🚀 Initializing ${this.contextName} Registry...`);
        
        try {
            // Setup context-specific gestures
            await this.setupGestures();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Register with HMI system
            this.hmiSystem.registerRegistry(this.contextName, this);
            
            this.initialized = true;
            console.info(`✅ ${this.contextName} Registry initialized`);
            
        } catch (error) {
            console.error(`❌ ${this.contextName} Registry initialization failed:`, error);
            throw error;
        }
    }

    /**
     * 🎯 GESTURE REGISTRATION
     */
    registerGesture(name, config) {
        const { pattern, handler, conditions = [], cooldown = 100 } = config;
        
        const gesture = this.hmiSystem.gesture(`${this.contextName}_${name}`);
        
        // Apply pattern
        if (pattern.type === 'mouse_circle') {
            gesture.mouseCircle(pattern.radius, pattern.tolerance);
        } else if (pattern.type === 'swipe') {
            gesture.swipe(pattern.direction, pattern.minDistance, pattern.maxTime);
        } else if (pattern.type === 'custom') {
            gesture.custom(pattern.detectionFn);
        }
        
        // Apply conditions
        conditions.forEach(condition => gesture.when(condition));
        
        // Apply cooldown
        gesture.cooldown(cooldown);
        
        // Apply handler
        gesture.on((data) => {
            if (this.active) {
                handler.call(this, data);
            }
        });
        
        this.gestures.set(name, gesture);
        console.info(`🎯 Gesture registered: ${this.contextName}.${name}`);
        
        return gesture;
    }

    /**
     * ▶️ ACTIVATION/DEACTIVATION
     */
    activate() {
        if (this.active) return;
        
        this.active = true;
        console.info(`▶️ ${this.contextName} Registry activated`);
        
        // Context-specific activation logic
        this.onActivate?.();
    }

    deactivate() {
        if (!this.active) return;
        
        this.active = false;
        console.info(`⏸️ ${this.contextName} Registry deactivated`);
        
        // Context-specific deactivation logic
        this.onDeactivate?.();
    }

    /**
     * 🎮 GESTURE HANDLING
     */
    handleGesture(gestureData) {
        if (!this.active) return;
        
        console.info(`🎮 ${this.contextName} handling gesture: ${gestureData.name}`);
        
        // Context-specific gesture handling
        this.onGestureDetected?.(gestureData);
    }

    /**
     * 📊 UTILITIES
     */
    isElementInContext(element) {
        // Override in subclasses to define context boundaries
        return true;
    }

    getContextElements() {
        // Override in subclasses to return relevant DOM elements
        return [];
    }

    getContextMetrics() {
        return {
            contextName: this.contextName,
            active: this.active,
            gestureCount: this.gestures.size,
            initialized: this.initialized
        };
    }

    /**
     * 🛠️ ABSTRACT METHODS (to be implemented by subclasses)
     */
    async setupGestures() {
        throw new Error(`setupGestures must be implemented by ${this.contextName} Registry`);
    }

    setupEventHandlers() {
        // Optional - can be overridden by subclasses
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.deactivate();
        this.gestures.clear();
        this.initialized = false;
        console.info(`🧹 ${this.contextName} Registry destroyed`);
    }
}

export default BaseRegistry;
