/**
 * NATIVE GESTURE DETECTOR - Core Component
 * Pure JavaScript gesture detection with advanced patterns
 */

const PRIVATE = Symbol('private');
const gestureMetadata = new WeakMap();

export class NativeGestureDetector {
    constructor(target = document) {
        this[PRIVATE] = {
            target,
            patterns: new Map(),
            activeGestures: new Set(),
            rafId: null,
            touchHistory: [],
            mouseHistory: [],
            sequenceTimers: new Map(),
            performanceMode: false,
            listeners: new Map()
        };

        // Proxy for dynamic pattern registration
        return new Proxy(this, {
            get(target, prop) {
                if (prop.startsWith('detect')) {
                    return target.createDynamicDetector(prop);
                }
                return target[prop];
            }
        });
    }

    /**
     * 🎯 FLUENT GESTURE API
     */
    gesture(name) {
        const gestureBuilder = {
            mouseCircle: (radius = 50, tolerance = 0.3) => {
                this.registerPattern(name, 'mouse_circle', { radius, tolerance });
                return gestureBuilder;
            },
            
            mouseZigzag: (minPoints = 4, amplitude = 30) => {
                this.registerPattern(name, 'mouse_zigzag', { minPoints, amplitude });
                return gestureBuilder;
            },
            
            mouseLine: (minLength = 100, maxDeviation = 20) => {
                this.registerPattern(name, 'mouse_line', { minLength, maxDeviation });
                return gestureBuilder;
            },

            swipe: (direction, minDistance = 50, maxTime = 500) => {
                this.registerPattern(name, 'swipe', { direction, minDistance, maxTime });
                return gestureBuilder;
            },

            pinch: (threshold = 0.2) => {
                this.registerPattern(name, 'pinch', { threshold });
                return gestureBuilder;
            },

            sequence: (...events) => {
                this.registerSequencePattern(name, events);
                return gestureBuilder;
            },

            custom: (detectionFn) => {
                this.registerPattern(name, 'custom', { detectionFn });
                return gestureBuilder;
            },

            on: (callback) => {
                this.addGestureHandler(name, callback);
                return gestureBuilder;
            },

            when: (condition) => {
                this.addGestureCondition(name, condition);
                return gestureBuilder;
            },

            cooldown: (ms) => {
                this.setGestureCooldown(name, ms);
                return gestureBuilder;
            }
        };

        return gestureBuilder;
    }

    /**
     * 🎪 DYNAMIC DETECTOR CREATION
     */
    createDynamicDetector(methodName) {
        const patternType = methodName.replace('detect', '').toLowerCase();
        
        return (options = {}) => {
            const patternName = `dynamic_${patternType}_${Date.now()}`;
            this.registerPattern(patternName, patternType, options);
            return this.startDetection(patternName);
        };
    }

    /**
     * 📋 PATTERN REGISTRATION
     */
    registerPattern(name, type, options) {
        this[PRIVATE].patterns.set(name, {
            type,
            options,
            handlers: [],
            conditions: [],
            cooldown: 100,
            lastTriggered: 0,
            active: false,
            stats: {
                triggered: 0,
                avgConfidence: 0,
                totalConfidence: 0
            }
        });
    }

    registerSequencePattern(name, eventSequence) {
        const sequenceGenerator = this.createSequenceGenerator(eventSequence);
        
        this.registerPattern(name, 'sequence', {
            generator: sequenceGenerator,
            currentStep: 0,
            timeout: 5000,
            sequence: eventSequence
        });
    }

    *createSequenceGenerator(eventSequence) {
        for (const step of eventSequence) {
            const result = yield step;
            if (!result.matches) {
                return { success: false, step };
            }
        }
        return { success: true };
    }

    /**
     * 🎯 GESTURE DETECTION ALGORITHMS
     */
    detectMouseCircle(points, options) {
        const { radius, tolerance } = options;
        
        if (points.length < 8) return { matches: false };

        const center = this.calculateCentroid(points);
        let radiusSum = 0;
        let validPoints = 0;

        for (const point of points) {
            const distance = this.distance(point, center);
            if (Math.abs(distance - radius) <= radius * tolerance) {
                radiusSum += distance;
                validPoints++;
            }
        }

        const coverage = validPoints / points.length;
        const avgRadius = radiusSum / validPoints;

        return {
            matches: coverage >= 0.7,
            confidence: coverage,
            radius: avgRadius,
            center,
            metadata: { points: points.length, coverage }
        };
    }

    detectSwipe(points, options) {
        const { direction, minDistance, maxTime } = options;
        
        if (points.length < 2) return { matches: false };

        const start = points[0];
        const end = points[points.length - 1];
        const distance = this.distance(start, end);
        const duration = end.timestamp - start.timestamp;

        if (distance < minDistance || duration > maxTime) {
            return { matches: false };
        }

        const angle = this.calculateAngle(start, end);
        const detectedDirection = this.angleToDirection(angle);

        return {
            matches: !direction || detectedDirection === direction,
            direction: detectedDirection,
            distance,
            duration,
            velocity: distance / duration,
            angle
        };
    }

    detectMouseZigzag(points, options) {
        const { minPoints, amplitude } = options;
        
        if (points.length < minPoints) return { matches: false };

        let changes = 0;
        let totalAmplitude = 0;

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const dir1 = curr.y - prev.y;
            const dir2 = next.y - curr.y;

            if (dir1 * dir2 < 0) {
                changes++;
                totalAmplitude += Math.abs(curr.y - prev.y);
            }
        }

        const avgAmplitude = totalAmplitude / Math.max(changes, 1);

        return {
            matches: changes >= minPoints / 2 && avgAmplitude >= amplitude,
            changes,
            avgAmplitude,
            confidence: Math.min(changes / (minPoints / 2), 1)
        };
    }

    detectPinch(touches, options) {
        const { threshold } = options;
        
        if (touches.length !== 2) return { matches: false };

        const [touch1, touch2] = touches;
        const initialDistance = this.distance(touch1.start, touch2.start);
        const currentDistance = this.distance(touch1.current, touch2.current);
        
        const scale = currentDistance / initialDistance;
        const scaleChange = Math.abs(1 - scale);

        return {
            matches: scaleChange >= threshold,
            scale,
            scaleChange,
            isPinchIn: scale < 1,
            isPinchOut: scale > 1
        };
    }

    /**
     * 🚀 DETECTION CONTROL
     */
    startDetection(patternName = null) {
        const patterns = patternName ? 
            [this[PRIVATE].patterns.get(patternName)] : 
            Array.from(this[PRIVATE].patterns.values());

        this.setupNativeListeners();
        this.startAnalysisLoop();

        patterns.forEach(pattern => {
            if (pattern) pattern.active = true;
        });

        return {
            stop: () => this.stopDetection(patternName),
            pause: () => this.pauseDetection(patternName),
            resume: () => this.resumeDetection(patternName)
        };
    }

    stopDetection(patternName = null) {
        if (patternName) {
            const pattern = this[PRIVATE].patterns.get(patternName);
            if (pattern) pattern.active = false;
        } else {
            this[PRIVATE].patterns.forEach(pattern => pattern.active = false);
            this.removeNativeListeners();
            if (this[PRIVATE].rafId) {
                cancelAnimationFrame(this[PRIVATE].rafId);
            }
        }
    }

    /**
     * 🎮 NATIVE EVENT LISTENERS
     */
    setupNativeListeners() {
        const { target } = this[PRIVATE];

        const mouseEvents = {
            mousedown: (e) => this.handleMouseStart(e),
            mousemove: (e) => this.handleMouseMove(e),
            mouseup: (e) => this.handleMouseEnd(e),
            wheel: (e) => this.handleWheel(e)
        };

        const touchEvents = {
            touchstart: (e) => this.handleTouchStart(e),
            touchmove: (e) => this.handleTouchMove(e),
            touchend: (e) => this.handleTouchEnd(e)
        };

        Object.entries({...mouseEvents, ...touchEvents}).forEach(([event, handler]) => {
            target.addEventListener(event, handler, { 
                passive: true, 
                capture: false 
            });
            this[PRIVATE].listeners.set(event, handler);
        });
    }

    removeNativeListeners() {
        const { target } = this[PRIVATE];
        
        this[PRIVATE].listeners.forEach((handler, event) => {
            target.removeEventListener(event, handler);
        });
        this[PRIVATE].listeners.clear();
    }

    /**
     * ⚡ RAF ANALYSIS LOOP
     */
    startAnalysisLoop() {
        const analyze = () => {
            this.analyzeActiveGestures();
            this[PRIVATE].rafId = requestAnimationFrame(analyze);
        };
        analyze();
    }

    analyzeActiveGestures() {
        const { patterns, mouseHistory, touchHistory } = this[PRIVATE];

        patterns.forEach((pattern, name) => {
            if (!pattern.active) return;

            let result = { matches: false };

            switch (pattern.type) {
                case 'mouse_circle':
                    result = this.detectMouseCircle(mouseHistory, pattern.options);
                    break;
                case 'mouse_zigzag':
                    result = this.detectMouseZigzag(mouseHistory, pattern.options);
                    break;
                case 'swipe':
                    result = this.detectSwipe(mouseHistory, pattern.options);
                    break;
                case 'pinch':
                    result = this.detectPinch(touchHistory, pattern.options);
                    break;
                case 'custom':
                    result = pattern.options.detectionFn(mouseHistory, touchHistory);
                    break;
                case 'sequence':
                    result = this.analyzeSequence(pattern, name);
                    break;
            }

            if (result.matches && this.checkConditions(pattern)) {
                this.triggerGesture(name, result);
            }
        });
    }

    /**
     * 🎯 GESTURE TRIGGERING
     */
    triggerGesture(name, result) {
        const pattern = this[PRIVATE].patterns.get(name);
        const now = performance.now();

        // Cooldown check
        if (now - pattern.lastTriggered < pattern.cooldown) return;

        pattern.lastTriggered = now;
        pattern.stats.triggered++;
        pattern.stats.totalConfidence += result.confidence || 0;
        pattern.stats.avgConfidence = pattern.stats.totalConfidence / pattern.stats.triggered;

        // Call handlers
        pattern.handlers.forEach(handler => {
            try {
                handler({
                    name,
                    type: pattern.type,
                    result,
                    timestamp: now,
                    target: this[PRIVATE].target,
                    stats: { ...pattern.stats }
                });
            } catch (error) {
                console.error(`Gesture handler error for ${name}:`, error);
            }
        });

        // Dispatch custom event
        this[PRIVATE].target.dispatchEvent(new CustomEvent('gesturedetected', {
            detail: { name, result, timestamp: now, type: pattern.type }
        }));
    }

    /**
     * 🔧 HELPER METHODS
     */
    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    calculateCentroid(points) {
        const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        return { x: sum.x / points.length, y: sum.y / points.length };
    }

    calculateAngle(start, end) {
        return Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
    }

    angleToDirection(angle) {
        const normalized = ((angle % 360) + 360) % 360;
        if (normalized < 45 || normalized >= 315) return 'right';
        if (normalized < 135) return 'down';
        if (normalized < 225) return 'left';
        return 'up';
    }

    addGestureHandler(name, callback) {
        const pattern = this[PRIVATE].patterns.get(name);
        if (pattern) pattern.handlers.push(callback);
    }

    addGestureCondition(name, condition) {
        const pattern = this[PRIVATE].patterns.get(name);
        if (pattern) pattern.conditions.push(condition);
    }

    setGestureCooldown(name, ms) {
        const pattern = this[PRIVATE].patterns.get(name);
        if (pattern) pattern.cooldown = ms;
    }

    checkConditions(pattern) {
        return pattern.conditions.every(condition => condition());
    }

    // Event handlers
    handleMouseStart(e) {
        this[PRIVATE].mouseHistory = [{
            x: e.clientX, y: e.clientY, 
            timestamp: performance.now(),
            pressure: e.pressure || 1
        }];
    }

    handleMouseMove(e) {
        if (this[PRIVATE].mouseHistory.length > 0) {
            this[PRIVATE].mouseHistory.push({
                x: e.clientX, y: e.clientY,
                timestamp: performance.now(),
                pressure: e.pressure || 1
            });

            if (this[PRIVATE].mouseHistory.length > 100) {
                this[PRIVATE].mouseHistory.shift();
            }
        }
    }

    handleMouseEnd(e) {
        // Analysis is handled in RAF loop
    }

    handleTouchStart(e) {
        this[PRIVATE].touchHistory = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            start: { x: touch.clientX, y: touch.clientY },
            current: { x: touch.clientX, y: touch.clientY },
            timestamp: performance.now()
        }));
    }

    handleTouchMove(e) {
        Array.from(e.touches).forEach(touch => {
            const existing = this[PRIVATE].touchHistory.find(t => t.id === touch.identifier);
            if (existing) {
                existing.current = { x: touch.clientX, y: touch.clientY };
            }
        });
    }

    handleTouchEnd(e) {
        // Remove ended touches
        const activeTouchIds = Array.from(e.touches).map(t => t.identifier);
        this[PRIVATE].touchHistory = this[PRIVATE].touchHistory.filter(t => 
            activeTouchIds.includes(t.id)
        );
    }

    handleWheel(e) {
        // Handle wheel events for zoom gestures
    }

    /**
     * 📊 PERFORMANCE METRICS
     */
    getPerformanceMetrics() {
        const patterns = Array.from(this[PRIVATE].patterns.entries()).map(([name, pattern]) => ({
            name,
            triggered: pattern.stats.triggered,
            avgConfidence: pattern.stats.avgConfidence,
            active: pattern.active
        }));

        return {
            totalPatterns: this[PRIVATE].patterns.size,
            activePatterns: patterns.filter(p => p.active).length,
            totalTriggers: patterns.reduce((sum, p) => sum + p.triggered, 0),
            patterns,
            performanceMode: this[PRIVATE].performanceMode
        };
    }

    setPerformanceMode(enabled) {
        this[PRIVATE].performanceMode = enabled;
        console.info(`Performance mode: ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.stopDetection();
        this.removeNativeListeners();
        this[PRIVATE].patterns.clear();
        this[PRIVATE].activeGestures.clear();
    }
}

export default NativeGestureDetector;
