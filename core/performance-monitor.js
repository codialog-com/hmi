/**
 * PERFORMANCE MONITOR - Real-time Performance Tracking
 * Native JS performance monitoring with auto-optimization
 */

export class PerformanceMonitor {
    constructor(options = {}) {
        this.sampleRate = options.sampleRate || 60;
        this.alertThreshold = options.alertThreshold || 30;
        this.maxSamples = options.maxSamples || 1000;
        
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            memoryUsage: 0,
            gestureLatency: 0,
            eventThroughput: 0
        };
        
        this.samples = [];
        this.alerts = [];
        this.monitoring = false;
        this.rafId = null;
        this.lastFrameTime = 0;
    }

    /**
     * 🚀 START MONITORING
     */
    startMonitoring() {
        if (this.monitoring) return;
        
        this.monitoring = true;
        this.lastFrameTime = performance.now();
        this.measurePerformance();
        
        console.info('📊 Performance monitoring started');
    }

    stopMonitoring() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        this.monitoring = false;
        console.info('📊 Performance monitoring stopped');
    }

    /**
     * 📈 PERFORMANCE MEASUREMENT
     */
    measurePerformance() {
        const measure = (timestamp) => {
            // Calculate FPS
            const frameTime = timestamp - this.lastFrameTime;
            const fps = 1000 / frameTime;
            
            // Update metrics
            this.updateMetrics(fps, frameTime);
            
            // Check for alerts
            this.checkPerformanceAlerts();
            
            // Add sample
            this.addSample({
                timestamp,
                fps,
                frameTime,
                memoryUsage: this.getMemoryUsage()
            });
            
            this.lastFrameTime = timestamp;
            
            if (this.monitoring) {
                this.rafId = requestAnimationFrame(measure);
            }
        };
        
        this.rafId = requestAnimationFrame(measure);
    }

    updateMetrics(fps, frameTime) {
        // Exponential moving average for smooth metrics
        const alpha = 0.1;
        
        this.metrics.fps = this.metrics.fps * (1 - alpha) + fps * alpha;
        this.metrics.frameTime = this.metrics.frameTime * (1 - alpha) + frameTime * alpha;
        this.metrics.memoryUsage = this.getMemoryUsage();
    }

    /**
     * 💾 MEMORY TRACKING
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    /**
     * ⚠️ ALERT SYSTEM
     */
    checkPerformanceAlerts() {
        const now = performance.now();
        
        // FPS too low
        if (this.metrics.fps < this.alertThreshold) {
            this.addAlert('low_fps', {
                fps: this.metrics.fps,
                threshold: this.alertThreshold,
                timestamp: now
            });
        }
        
        // Frame time too high
        if (this.metrics.frameTime > 33) { // > 2 frames at 60fps
            this.addAlert('high_frame_time', {
                frameTime: this.metrics.frameTime,
                timestamp: now
            });
        }
        
        // Memory usage high
        const memory = this.getMemoryUsage();
        if (memory && memory.used / memory.limit > 0.8) {
            this.addAlert('high_memory', {
                usage: memory.used / memory.limit,
                timestamp: now
            });
        }
    }

    addAlert(type, data) {
        const alert = { type, data, timestamp: performance.now() };
        this.alerts.push(alert);
        
        // Limit alerts array
        if (this.alerts.length > 100) {
            this.alerts.shift();
        }
        
        // Emit alert event
        if (typeof CustomEvent !== 'undefined') {
            document.dispatchEvent(new CustomEvent('performance-alert', {
                detail: alert
            }));
        }
        
        console.warn(`⚠️ Performance Alert [${type}]:`, data);
    }

    /**
     * 📊 SAMPLE MANAGEMENT
     */
    addSample(sample) {
        this.samples.push(sample);
        
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
    }

    /**
     * 📈 ANALYTICS
     */
    getMetrics() {
        return { ...this.metrics };
    }

    getRecentSamples(count = 60) {
        return this.samples.slice(-count);
    }

    getAlerts(since = 0) {
        return this.alerts.filter(alert => alert.timestamp >= since);
    }

    getPerformanceReport() {
        const samples = this.getRecentSamples();
        
        if (samples.length === 0) {
            return { error: 'No samples available' };
        }
        
        const avgFps = samples.reduce((sum, s) => sum + s.fps, 0) / samples.length;
        const minFps = Math.min(...samples.map(s => s.fps));
        const maxFps = Math.max(...samples.map(s => s.fps));
        
        const avgFrameTime = samples.reduce((sum, s) => sum + s.frameTime, 0) / samples.length;
        const maxFrameTime = Math.max(...samples.map(s => s.frameTime));
        
        return {
            fps: {
                current: this.metrics.fps,
                average: avgFps,
                min: minFps,
                max: maxFps
            },
            frameTime: {
                current: this.metrics.frameTime,
                average: avgFrameTime,
                max: maxFrameTime
            },
            memory: this.getMemoryUsage(),
            alerts: this.getAlerts(performance.now() - 60000), // Last minute
            sampleCount: samples.length,
            monitoring: this.monitoring
        };
    }

    /**
     * 🔧 OPTIMIZATION
     */
    enablePerformanceMode() {
        console.info('🚨 Enabling performance mode');
        
        // Reduce sample rate
        this.sampleRate = Math.max(15, this.sampleRate / 2);
        
        // Clear old samples
        this.samples = this.samples.slice(-100);
        
        // Emit performance mode event
        document.dispatchEvent(new CustomEvent('performance-mode-enabled', {
            detail: { sampleRate: this.sampleRate }
        }));
    }

    disablePerformanceMode() {
        console.info('✅ Disabling performance mode');
        this.sampleRate = 60;
        
        document.dispatchEvent(new CustomEvent('performance-mode-disabled'));
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.stopMonitoring();
        this.samples = [];
        this.alerts = [];
    }
}

export default PerformanceMonitor;
