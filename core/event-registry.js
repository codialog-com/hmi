/**
 * EVENT REGISTRY - Centralized Event Management
 * Native JS event system with performance optimization
 */

const PRIVATE = Symbol('private');
const LISTENERS = Symbol('listeners');

export class EventRegistry {
    constructor(options = {}) {
        this[PRIVATE] = {
            hmiSystem: options.hmiSystem,
            maxEvents: options.maxEvents || 1000,
            eventHistory: [],
            activeListeners: 0,
            performanceMode: false
        };

        this[LISTENERS] = new Map();
    }

    /**
     * 📝 EVENT REGISTRATION
     */
    on(eventName, handler, options = {}) {
        if (!this[LISTENERS].has(eventName)) {
            this[LISTENERS].set(eventName, new Set());
        }

        const wrappedHandler = this.wrapHandler(handler, options);
        this[LISTENERS].get(eventName).add(wrappedHandler);
        this[PRIVATE].activeListeners++;

        return () => this.off(eventName, wrappedHandler);
    }

    off(eventName, handler) {
        const listeners = this[LISTENERS].get(eventName);
        if (listeners) {
            const removed = listeners.delete(handler);
            if (removed) {
                this[PRIVATE].activeListeners--;
            }
            if (listeners.size === 0) {
                this[LISTENERS].delete(eventName);
            }
            return removed;
        }
        return false;
    }

    /**
     * 📤 EVENT DISPATCHING
     */
    dispatch(eventName, data = {}) {
        const startTime = performance.now();
        const listeners = this[LISTENERS].get(eventName);
        
        if (!listeners || listeners.size === 0) {
            return false;
        }

        const eventData = {
            type: eventName,
            data,
            timestamp: startTime,
            target: this[PRIVATE].hmiSystem
        };

        // Add to history
        this.addToHistory(eventData);

        // Call listeners
        let successCount = 0;
        for (const listener of listeners) {
            try {
                listener(eventData);
                successCount++;
            } catch (error) {
                console.error(`Event listener error for ${eventName}:`, error);
            }
        }

        const duration = performance.now() - startTime;
        
        // Performance monitoring
        if (duration > 16) { // > 1 frame at 60fps
            console.warn(`Slow event dispatch: ${eventName} took ${duration.toFixed(2)}ms`);
        }

        return { successCount, duration, listeners: listeners.size };
    }

    /**
     * 🎁 HANDLER WRAPPER
     */
    wrapHandler(handler, options) {
        const { once = false, throttle = 0, debounce = 0 } = options;
        
        let lastCall = 0;
        let timeoutId = null;
        let called = false;

        return (eventData) => {
            if (once && called) return;
            
            const now = performance.now();
            
            // Throttling
            if (throttle && now - lastCall < throttle) {
                return;
            }
            
            // Debouncing
            if (debounce) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    handler(eventData);
                    lastCall = now;
                    if (once) called = true;
                }, debounce);
                return;
            }
            
            // Normal execution
            handler(eventData);
            lastCall = now;
            if (once) called = true;
        };
    }

    /**
     * 📚 EVENT HISTORY
     */
    addToHistory(eventData) {
        this[PRIVATE].eventHistory.push({
            ...eventData,
            id: this.generateEventId()
        });

        // Limit history size
        if (this[PRIVATE].eventHistory.length > this[PRIVATE].maxEvents) {
            this[PRIVATE].eventHistory.shift();
        }
    }

    getHistory(filter = {}) {
        let history = [...this[PRIVATE].eventHistory];
        
        if (filter.type) {
            history = history.filter(e => e.type === filter.type);
        }
        
        if (filter.since) {
            history = history.filter(e => e.timestamp >= filter.since);
        }
        
        if (filter.limit) {
            history = history.slice(-filter.limit);
        }
        
        return history;
    }

    /**
     * 🔢 UTILITIES
     */
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 📊 METRICS
     */
    getMetrics() {
        const eventTypes = new Map();
        this[PRIVATE].eventHistory.forEach(event => {
            const count = eventTypes.get(event.type) || 0;
            eventTypes.set(event.type, count + 1);
        });

        return {
            totalEvents: this[PRIVATE].eventHistory.length,
            activeListeners: this[PRIVATE].activeListeners,
            eventTypes: Object.fromEntries(eventTypes),
            recentEvents: this[PRIVATE].eventHistory.slice(-10)
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this[LISTENERS].clear();
        this[PRIVATE].eventHistory = [];
        this[PRIVATE].activeListeners = 0;
    }
}

export default EventRegistry;
