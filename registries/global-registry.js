/**
 * GLOBAL REGISTRY - System-wide Gestures & Global Actions
 * Application-level gestures that work across all contexts
 */

import { BaseRegistry } from './base-registry.js';

export class GlobalRegistry extends BaseRegistry {
    constructor(hmiSystem) {
        super(hmiSystem, 'global');
        
        this.globalShortcuts = new Map();
        this.emergencyGestures = new Map();
        this.systemState = {
            fullscreen: false,
            debugMode: false,
            performanceMode: false,
            helpVisible: false
        };
        this.gestureComboHistory = [];
    }

    /**
     * 🎯 GLOBAL GESTURE SETUP
     */
    async setupGestures() {
        console.info(`🌐 Setting up global gestures...`);

        // 1. SYSTEM CONTROL GESTURES
        this.setupSystemControlGestures();
        
        // 2. NAVIGATION GESTURES
        this.setupGlobalNavigationGestures();
        
        // 3. APPLICATION GESTURES
        this.setupApplicationGestures();
        
        // 4. EMERGENCY/DEBUG GESTURES
        this.setupEmergencyGestures();
        
        // 5. HELP/ASSISTANCE GESTURES
        this.setupHelpGestures();
        
        // 6. PERFORMANCE GESTURES
        this.setupPerformanceGestures();
    }

    /**
     * 🎛️ SYSTEM CONTROL GESTURES
     */
    setupSystemControlGestures() {
        // Global undo (Z gesture)
        this.registerGesture('global_undo', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectZGesture(mouseHistory)
            },
            handler: this.handleGlobalUndo,
            cooldown: 500
        });

        // Global redo (reverse Z gesture)
        this.registerGesture('global_redo', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectReverseZGesture(mouseHistory)
            },
            handler: this.handleGlobalRedo,
            cooldown: 500
        });

        // Save project (S gesture)
        this.registerGesture('quick_save', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectSGesture(mouseHistory)
            },
            handler: this.handleQuickSave,
            cooldown: 1000
        });

        // Open project (O gesture)
        this.registerGesture('quick_open', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectOGesture(mouseHistory)
            },
            handler: this.handleQuickOpen,
            cooldown: 1000
        });

        // Fullscreen toggle (rectangle around screen)
        this.registerGesture('toggle_fullscreen', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectFullscreenGesture(mouseHistory)
            },
            handler: this.handleToggleFullscreen,
            cooldown: 2000
        });
    }

    /**
     * 🧭 GLOBAL NAVIGATION GESTURES
     */
    setupGlobalNavigationGestures() {
        // Go back (left swipe from edge)
        this.registerGesture('global_back', {
            pattern: {
                type: 'swipe',
                direction: 'right',
                minDistance: 100,
                maxTime: 400
            },
            handler: this.handleGlobalBack,
            conditions: [() => this.isSwipeFromLeftEdge()],
            cooldown: 300
        });

        // Go forward (right swipe from edge)
        this.registerGesture('global_forward', {
            pattern: {
                type: 'swipe',
                direction: 'left',
                minDistance: 100,
                maxTime: 400
            },
            handler: this.handleGlobalForward,
            conditions: [() => this.isSwipeFromRightEdge()],
            cooldown: 300
        });

        // Home/reset view (H gesture)
        this.registerGesture('go_home', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectHGesture(mouseHistory)
            },
            handler: this.handleGoHome,
            cooldown: 800
        });

        // Switch workspace (swipe up with 3 fingers)
        this.registerGesture('switch_workspace', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory, touchHistory) => this.detectWorkspaceSwitch(touchHistory)
            },
            handler: this.handleSwitchWorkspace,
            cooldown: 1000
        });
    }

    /**
     * 📱 APPLICATION GESTURES
     */
    setupApplicationGestures() {
        // Application menu (circle + tap center)
        this.registerGesture('app_menu', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectMenuGesture(mouseHistory)
            },
            handler: this.handleAppMenu,
            cooldown: 600
        });

        // Search everywhere (magnifying glass gesture)
        this.registerGesture('global_search', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectMagnifyingGlass(mouseHistory)
            },
            handler: this.handleGlobalSearch,
            cooldown: 800
        });

        // Quick actions (long press + radial menu)
        this.registerGesture('quick_actions', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectLongPressRadial(mouseHistory)
            },
            handler: this.handleQuickActions,
            cooldown: 500
        });

        // Theme toggle (moon/sun gesture)
        this.registerGesture('toggle_theme', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectThemeToggleGesture(mouseHistory)
            },
            handler: this.handleToggleTheme,
            cooldown: 1500
        });
    }

    /**
     * 🚨 EMERGENCY/DEBUG GESTURES
     */
    setupEmergencyGestures() {
        // Emergency stop (X gesture)
        this.registerGesture('emergency_stop', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectXGesture(mouseHistory)
            },
            handler: this.handleEmergencyStop,
            cooldown: 0 // No cooldown for emergency
        });

        // Debug mode toggle (question mark gesture)
        this.registerGesture('toggle_debug', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectQuestionMarkGesture(mouseHistory)
            },
            handler: this.handleToggleDebug,
            cooldown: 1000
        });

        // System reset (double X gesture)
        this.registerGesture('system_reset', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectDoubleXGesture(mouseHistory)
            },
            handler: this.handleSystemReset,
            cooldown: 5000
        });

        // Performance monitor (P + circle)
        this.registerGesture('performance_monitor', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectPerformanceGesture(mouseHistory)
            },
            handler: this.handlePerformanceMonitor,
            cooldown: 2000
        });
    }

    /**
     * ❓ HELP GESTURES
     */
    setupHelpGestures() {
        // Show help (question mark gesture)
        this.registerGesture('show_help', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectQuestionMarkGesture(mouseHistory)
            },
            handler: this.handleShowHelp,
            cooldown: 1000
        });

        // Gesture guide (G + circle)
        this.registerGesture('gesture_guide', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectGestureGuidePattern(mouseHistory)
            },
            handler: this.handleGestureGuide,
            cooldown: 2000
        });

        // Tutorial mode (T gesture)
        this.registerGesture('tutorial_mode', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectTGesture(mouseHistory)
            },
            handler: this.handleTutorialMode,
            cooldown: 3000
        });

        // Context help (long press + circle)
        this.registerGesture('context_help', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectContextHelpGesture(mouseHistory)
            },
            handler: this.handleContextHelp,
            cooldown: 800
        });
    }

    /**
     * ⚡ PERFORMANCE GESTURES
     */
    setupPerformanceGestures() {
        // Enable performance mode (lightning bolt gesture)
        this.registerGesture('enable_performance_mode', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectLightningBolt(mouseHistory)
            },
            handler: this.handleEnablePerformanceMode,
            cooldown: 3000
        });

        // Memory cleanup (spiral gesture)
        this.registerGesture('memory_cleanup', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectSpiralGesture(mouseHistory)
            },
            handler: this.handleMemoryCleanup,
            cooldown: 5000
        });

        // FPS monitor toggle (F + number)
        this.registerGesture('fps_monitor', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectFPSGesture(mouseHistory)
            },
            handler: this.handleFPSMonitor,
            cooldown: 1000
        });
    }

    /**
     * 🎯 DETECTION ALGORITHMS
     */
    detectZGesture(mouseHistory) {
        if (mouseHistory.length < 6) return { matches: false };

        const path = mouseHistory.map(p => ({ x: p.x, y: p.y }));
        const isZShape = this.analyzeZPattern(path);

        return {
            matches: isZShape.confidence > 0.7,
            confidence: isZShape.confidence,
            direction: 'undo'
        };
    }

    detectXGesture(mouseHistory) {
        if (mouseHistory.length < 8) return { matches: false };

        const lines = this.findLineSegments(mouseHistory);
        const isCrossPattern = this.analyzeCrossPattern(lines);

        return {
            matches: isCrossPattern.confidence > 0.6,
            confidence: isCrossPattern.confidence,
            urgency: 'high'
        };
    }

    detectMagnifyingGlass(mouseHistory) {
        if (mouseHistory.length < 10) return { matches: false };

        // Circle + line (handle)
        const circleResult = this.detectCircleInHistory(mouseHistory.slice(0, 8));
        const handleResult = this.detectHandle(mouseHistory.slice(6));

        return {
            matches: circleResult.matches && handleResult.matches,
            circle: circleResult,
            handle: handleResult,
            confidence: (circleResult.confidence + handleResult.confidence) / 2
        };
    }

    detectLightningBolt(mouseHistory) {
        if (mouseHistory.length < 8) return { matches: false };

        const zigzagPattern = this.analyzeZigzagPattern(mouseHistory);
        const isVerticallyOriented = this.isVerticalPattern(mouseHistory);

        return {
            matches: zigzagPattern.changes >= 3 && isVerticallyOriented,
            pattern: zigzagPattern,
            confidence: Math.min(zigzagPattern.changes / 4, 1)
        };
    }

    detectSpiralGesture(mouseHistory) {
        if (mouseHistory.length < 12) return { matches: false };

        const spiralAnalysis = this.analyzeSpiralPattern(mouseHistory);

        return {
            matches: spiralAnalysis.isSpiralLike,
            turns: spiralAnalysis.turns,
            direction: spiralAnalysis.direction,
            confidence: spiralAnalysis.confidence
        };
    }

    /**
     * 🎪 GESTURE HANDLERS
     */
    handleGlobalUndo(data) {
        console.info('↶ Global undo');
        
        if (window.actionManager) {
            window.actionManager.undo();
        } else if (document.execCommand) {
            document.execCommand('undo');
        }
        
        this.showGlobalFeedback('Undo', '↶');
        this.trackGlobalGesture('undo', data);
    }

    handleGlobalRedo(data) {
        console.info('↷ Global redo');
        
        if (window.actionManager) {
            window.actionManager.redo();
        } else if (document.execCommand) {
            document.execCommand('redo');
        }
        
        this.showGlobalFeedback('Redo', '↷');
        this.trackGlobalGesture('redo', data);
    }

    handleQuickSave(data) {
        console.info('💾 Quick save');
        
        if (window.exportManager) {
            window.exportManager.quickSave();
        }
        
        this.showGlobalFeedback('Saved', '💾');
        this.trackGlobalGesture('save', data);
    }

    handleToggleFullscreen(data) {
        console.info('🖥️ Toggle fullscreen');
        
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.systemState.fullscreen = true;
        } else {
            document.exitFullscreen();
            this.systemState.fullscreen = false;
        }
        
        this.showGlobalFeedback(
            this.systemState.fullscreen ? 'Fullscreen' : 'Windowed',
            this.systemState.fullscreen ? '⛶' : '⧉'
        );
        this.trackGlobalGesture('fullscreen', data);
    }

    handleEmergencyStop(data) {
        console.warn('🚨 Emergency stop activated');
        
        // Stop all animations
        document.querySelectorAll('*').forEach(el => {
            el.style.animationPlayState = 'paused';
        });
        
        // Stop simulation
        if (window.simulationManager) {
            window.simulationManager.stop();
        }
        
        // Show emergency indicator
        this.showEmergencyIndicator();
        this.trackGlobalGesture('emergency_stop', data);
    }

    handleGlobalSearch(data) {
        console.info('🔍 Global search');
        
        this.showGlobalSearchInterface();
        this.trackGlobalGesture('search', data);
    }

    handleToggleDebug(data) {
        console.info('🛠️ Toggle debug mode');
        
        this.systemState.debugMode = !this.systemState.debugMode;
        
        if (this.systemState.debugMode) {
            this.hmiSystem.enableDebugMode();
            this.showDebugOverlay();
        } else {
            this.hideDebugOverlay();
        }
        
        this.showGlobalFeedback(
            `Debug ${this.systemState.debugMode ? 'ON' : 'OFF'}`,
            '🛠️'
        );
        this.trackGlobalGesture('debug_toggle', data);
    }

    handleShowHelp(data) {
        console.info('❓ Show help');
        
        this.systemState.helpVisible = !this.systemState.helpVisible;
        
        if (this.systemState.helpVisible) {
            this.showHelpOverlay();
        } else {
            this.hideHelpOverlay();
        }
        
        this.trackGlobalGesture('help', data);
    }

    handleEnablePerformanceMode(data) {
        console.info('⚡ Performance mode');
        
        this.systemState.performanceMode = !this.systemState.performanceMode;
        
        if (this.systemState.performanceMode) {
            this.hmiSystem.getPerformanceMonitor?.()?.enablePerformanceMode();
            this.optimizeForPerformance();
        } else {
            this.hmiSystem.getPerformanceMonitor?.()?.disablePerformanceMode();
            this.restoreNormalMode();
        }
        
        this.showGlobalFeedback(
            `Performance ${this.systemState.performanceMode ? 'ON' : 'OFF'}`,
            '⚡'
        );
        this.trackGlobalGesture('performance_mode', data);
    }

    /**
     * 🎨 UI FEEDBACK METHODS
     */
    showGlobalFeedback(message, icon) {
        const feedback = document.createElement('div');
        feedback.className = 'hmi-global-feedback';
        feedback.innerHTML = `<span class="icon">${icon}</span><span class="message">${message}</span>`;
        
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            z-index: 10001;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            animation: globalFeedbackAnimation 1.5s ease-out forwards;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1500);
    }

    showEmergencyIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'hmi-emergency-indicator';
        indicator.textContent = '🚨 EMERGENCY STOP ACTIVATED 🚨';
        
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: #ff0000;
            color: white;
            text-align: center;
            padding: 10px;
            font-weight: bold;
            font-size: 16px;
            z-index: 10002;
            animation: emergencyBlink 1s infinite;
        `;
        
        document.body.appendChild(indicator);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (indicator.parentElement) indicator.remove();
        }, 10000);
    }

    showGlobalSearchInterface() {
        const searchOverlay = document.createElement('div');
        searchOverlay.className = 'hmi-global-search';
        searchOverlay.innerHTML = `
            <div class="search-container">
                <h3>🔍 Global Search</h3>
                <input type="text" placeholder="Search everything..." autofocus>
                <div class="search-categories">
                    <button>Components</button>
                    <button>Properties</button>
                    <button>Actions</button>
                    <button>Help</button>
                </div>
                <button class="close-search" onclick="this.closest('.hmi-global-search').remove()">×</button>
            </div>
        `;
        
        searchOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10003;
        `;
        
        document.body.appendChild(searchOverlay);
    }

    /**
     * 🔧 UTILITY METHODS
     */
    isSwipeFromLeftEdge() {
        // Check if gesture started near left edge of screen
        return window.innerWidth < 50; // Simplified check
    }

    isSwipeFromRightEdge() {
        // Check if gesture started near right edge of screen
        return window.innerWidth > window.innerWidth - 50; // Simplified check
    }

    optimizeForPerformance() {
        // Reduce visual effects
        document.body.classList.add('performance-mode');
        
        // Disable animations
        const style = document.createElement('style');
        style.textContent = `
            .performance-mode * {
                animation-duration: 0.01ms !important;
                animation-delay: 0.01ms !important;
                transition-duration: 0.01ms !important;
                transition-delay: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }

    trackGlobalGesture(gestureName, data) {
        console.info(`🌐 Global gesture: ${gestureName}`, data.result);
        
        // Add to combo history for pattern detection
        this.gestureComboHistory.push({
            name: gestureName,
            timestamp: performance.now(),
            data: data.result
        });
        
        // Limit combo history
        if (this.gestureComboHistory.length > 10) {
            this.gestureComboHistory.shift();
        }
        
        // Analytics integration
        if (window.analyticsManager) {
            window.analyticsManager.trackGlobalGesture(gestureName, data);
        }
    }

    /**
     * 📊 CONTEXT OVERRIDES
     */
    isElementInContext(element) {
        // Global context applies everywhere
        return true;
    }

    getContextElements() {
        // Global context includes the entire document
        return [document.documentElement];
    }

    getContextMetrics() {
        return {
            ...super.getContextMetrics(),
            systemState: { ...this.systemState },
            shortcutsCount: this.globalShortcuts.size,
            emergencyGesturesCount: this.emergencyGestures.size,
            recentGestureCombo: this.gestureComboHistory.slice(-3)
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.globalShortcuts.clear();
        this.emergencyGestures.clear();
        this.gestureComboHistory = [];
        
        // Remove global UI elements
        document.querySelectorAll('.hmi-global-feedback, .hmi-emergency-indicator, .hmi-global-search').forEach(el => el.remove());
        
        // Remove performance mode
        document.body.classList.remove('performance-mode');
        
        super.destroy();
    }
}

export default GlobalRegistry;
