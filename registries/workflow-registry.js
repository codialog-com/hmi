/**
 * WORKFLOW REGISTRY - Complex User Workflow Detection
 * Multi-step workflow gestures and process automation
 */

import { BaseRegistry } from './base-registry.js';

export class WorkflowRegistry extends BaseRegistry {
    constructor(hmiSystem) {
        super(hmiSystem, 'workflow');
        
        this.activeWorkflows = new Map();
        this.workflowHistory = [];
        this.workflowTemplates = new Map();
        this.stepTimeout = 10000; // 10 seconds between steps
        this.maxWorkflowLength = 10;
    }

    /**
     * 🎯 WORKFLOW-SPECIFIC GESTURE SETUP
     */
    async setupGestures() {
        console.info(`🔄 Setting up workflow gestures...`);

        // 1. COMPONENT CREATION WORKFLOWS
        this.setupComponentWorkflows();
        
        // 2. DESIGN PROCESS WORKFLOWS
        this.setupDesignWorkflows();
        
        // 3. SIMULATION WORKFLOWS
        this.setupSimulationWorkflows();
        
        // 4. EXPORT/IMPORT WORKFLOWS
        this.setupDataWorkflows();
        
        // 5. COLLABORATION WORKFLOWS
        this.setupCollaborationWorkflows();

        // Initialize common workflow templates
        this.initializeWorkflowTemplates();
    }

    /**
     * 🧩 COMPONENT CREATION WORKFLOWS
     */
    setupComponentWorkflows() {
        // Complete component creation (palette → canvas → configure → connect)
        this.registerGesture('complete_component_creation', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectComponentCreationWorkflow(mouseHistory)
            },
            handler: this.handleCompleteComponentCreation,
            cooldown: 2000
        });

        // Component configuration workflow (select → properties → test → apply)
        this.registerGesture('component_configuration', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectConfigurationWorkflow(mouseHistory)
            },
            handler: this.handleComponentConfiguration,
            conditions: [() => this.hasSelectedComponent()],
            cooldown: 1500
        });

        // Component duplication workflow (select → copy → place → modify)
        this.registerGesture('component_duplication', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectDuplicationWorkflow(mouseHistory)
            },
            handler: this.handleComponentDuplication,
            conditions: [() => this.hasSelectedComponent()],
            cooldown: 1000
        });

        // Connection creation workflow (select source → drag → select target → configure)
        this.registerGesture('connection_workflow', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectConnectionWorkflow(mouseHistory)
            },
            handler: this.handleConnectionWorkflow,
            conditions: [() => this.hasMultipleComponents()],
            cooldown: 1500
        });
    }

    /**
     * 🎨 DESIGN PROCESS WORKFLOWS
     */
    setupDesignWorkflows() {
        // Layout optimization workflow (select all → analyze → suggest → apply)
        this.registerGesture('layout_optimization', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectLayoutOptimization(mouseHistory)
            },
            handler: this.handleLayoutOptimization,
            conditions: [() => this.hasMultipleComponents()],
            cooldown: 3000
        });

        // Design review workflow (zoom out → inspect → annotate → approve)
        this.registerGesture('design_review', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectDesignReviewWorkflow(mouseHistory)
            },
            handler: this.handleDesignReview,
            conditions: [() => this.hasCompleteDesign()],
            cooldown: 5000
        });

        // Style application workflow (select template → apply → customize → save)
        this.registerGesture('style_application', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectStyleWorkflow(mouseHistory)
            },
            handler: this.handleStyleApplication,
            cooldown: 2000
        });
    }

    /**
     * 🔬 SIMULATION WORKFLOWS
     */
    setupSimulationWorkflows() {
        // Simulation setup workflow (configure → validate → run → analyze)
        this.registerGesture('simulation_setup', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectSimulationSetup(mouseHistory)
            },
            handler: this.handleSimulationSetup,
            conditions: [() => this.hasSimulatableComponents()],
            cooldown: 3000
        });

        // Debug workflow (run → pause → inspect → fix → continue)
        this.registerGesture('debug_workflow', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectDebugWorkflow(mouseHistory)
            },
            handler: this.handleDebugWorkflow,
            conditions: [() => this.isSimulationRunning()],
            cooldown: 1000
        });

        // Performance analysis workflow (monitor → collect → analyze → optimize)
        this.registerGesture('performance_analysis', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectPerformanceWorkflow(mouseHistory)
            },
            handler: this.handlePerformanceAnalysis,
            cooldown: 4000
        });
    }

    /**
     * 📁 DATA WORKFLOWS
     */
    setupDataWorkflows() {
        // Export workflow (select → validate → format → export → verify)
        this.registerGesture('complete_export', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectExportWorkflow(mouseHistory)
            },
            handler: this.handleCompleteExport,
            conditions: [() => this.hasExportableContent()],
            cooldown: 3000
        });

        // Import workflow (select file → validate → merge → configure → apply)
        this.registerGesture('complete_import', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectImportWorkflow(mouseHistory)
            },
            handler: this.handleCompleteImport,
            cooldown: 3000
        });

        // Backup workflow (prepare → backup → verify → notify)
        this.registerGesture('backup_workflow', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectBackupWorkflow(mouseHistory)
            },
            handler: this.handleBackupWorkflow,
            cooldown: 5000
        });
    }

    /**
     * 👥 COLLABORATION WORKFLOWS
     */
    setupCollaborationWorkflows() {
        // Share workflow (prepare → package → share → notify)
        this.registerGesture('share_workflow', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectShareWorkflow(mouseHistory)
            },
            handler: this.handleShareWorkflow,
            conditions: [() => this.hasShareableContent()],
            cooldown: 4000
        });

        // Review workflow (receive → review → comment → approve/reject)
        this.registerGesture('review_workflow', {
            pattern: {
                type: 'custom',
                detectionFn: (mouseHistory) => this.detectReviewWorkflow(mouseHistory)
            },
            handler: this.handleReviewWorkflow,
            conditions: [() => this.hasPendingReviews()],
            cooldown: 2000
        });
    }

    /**
     * 🎯 WORKFLOW DETECTION ALGORITHMS
     */
    detectComponentCreationWorkflow(mouseHistory) {
        // Multi-step sequence: palette interaction → canvas drag → properties panel → connections
        const steps = this.analyzeWorkflowSteps(mouseHistory, [
            'palette_interaction',
            'canvas_drag',
            'properties_config',
            'connection_attempt'
        ]);

        return {
            matches: steps.completedSteps >= 3,
            steps: steps.detectedSteps,
            completionRate: steps.completedSteps / 4,
            confidence: steps.confidence,
            nextSuggestedStep: steps.nextStep
        };
    }

    detectConfigurationWorkflow(mouseHistory) {
        // Configuration sequence: component selection → properties edit → value changes → apply
        const configSteps = this.findConfigurationSequence(mouseHistory);
        
        return {
            matches: configSteps.length >= 3,
            configurationSteps: configSteps,
            modifiedProperties: configSteps.filter(step => step.type === 'property_change'),
            confidence: Math.min(configSteps.length / 4, 1)
        };
    }

    detectLayoutOptimization(mouseHistory) {
        // Layout optimization: select multiple → analyze positions → suggest improvements
        const layoutAnalysis = this.analyzeLayoutGestures(mouseHistory);
        
        return {
            matches: layoutAnalysis.hasMultiSelection && layoutAnalysis.hasMovementAttempts,
            analysisResult: layoutAnalysis,
            optimizationOpportunities: this.findOptimizationOpportunities(),
            confidence: layoutAnalysis.confidence
        };
    }

    detectSimulationSetup(mouseHistory) {
        // Simulation setup: configuration → validation → execution preparation
        const simSteps = this.findSimulationSteps(mouseHistory);
        
        return {
            matches: simSteps.hasConfiguration && simSteps.hasValidation,
            simulationSteps: simSteps,
            readinessLevel: this.calculateSimulationReadiness(),
            confidence: simSteps.confidence
        };
    }

    detectExportWorkflow(mouseHistory) {
        // Export workflow: content selection → format choice → export execution
        const exportSteps = this.analyzeExportSequence(mouseHistory);
        
        return {
            matches: exportSteps.hasSelection && exportSteps.hasFormatChoice,
            exportSteps,
            selectedContent: this.getSelectedExportContent(),
            confidence: exportSteps.confidence
        };
    }

    /**
     * 🎪 WORKFLOW HANDLERS
     */
    handleCompleteComponentCreation(data) {
        console.info('🏗️ Complete component creation workflow detected');
        
        const workflow = this.createWorkflow('component_creation', data.result.steps);
        this.executeWorkflowGuidance(workflow);
        this.trackWorkflowCompletion('component_creation', data.result.completionRate);
    }

    handleComponentConfiguration(data) {
        console.info('⚙️ Component configuration workflow detected');
        
        const workflow = this.createWorkflow('configuration', data.result.configurationSteps);
        this.showConfigurationSummary(data.result.modifiedProperties);
        this.trackWorkflowCompletion('configuration', 1.0);
    }

    handleLayoutOptimization(data) {
        console.info('📐 Layout optimization workflow detected');
        
        const optimizations = data.result.optimizationOpportunities;
        this.suggestLayoutImprovements(optimizations);
        this.trackWorkflowCompletion('layout_optimization', data.result.confidence);
    }

    handleSimulationSetup(data) {
        console.info('🔬 Simulation setup workflow detected');
        
        const readiness = data.result.readinessLevel;
        if (readiness > 0.8) {
            this.autoStartSimulation();
        } else {
            this.showSimulationPreparationGuide(data.result.simulationSteps);
        }
        
        this.trackWorkflowCompletion('simulation_setup', readiness);
    }

    handleCompleteExport(data) {
        console.info('📤 Complete export workflow detected');
        
        const content = data.result.selectedContent;
        this.executeExportWithConfirmation(content);
        this.trackWorkflowCompletion('export', 1.0);
    }

    handleDesignReview(data) {
        console.info('👁️ Design review workflow detected');
        
        this.enterReviewMode();
        this.showReviewChecklist();
        this.trackWorkflowCompletion('design_review', 1.0);
    }

    /**
     * 🏗️ WORKFLOW MANAGEMENT
     */
    createWorkflow(type, steps) {
        const workflow = {
            id: this.generateWorkflowId(),
            type,
            steps,
            startTime: performance.now(),
            status: 'active',
            progress: 0
        };
        
        this.activeWorkflows.set(workflow.id, workflow);
        return workflow;
    }

    executeWorkflowGuidance(workflow) {
        const guidance = this.getWorkflowGuidance(workflow.type);
        this.showWorkflowGuide(guidance, workflow);
    }

    getWorkflowGuidance(workflowType) {
        const guidelines = {
            component_creation: [
                'Select component from palette',
                'Drag to canvas position',
                'Configure properties',
                'Connect to other components',
                'Test functionality'
            ],
            configuration: [
                'Select target component',
                'Open properties panel',
                'Modify required settings',
                'Apply changes',
                'Verify results'
            ],
            simulation_setup: [
                'Configure simulation parameters',
                'Validate component connections',
                'Set initial conditions',
                'Run simulation',
                'Monitor results'
            ]
        };
        
        return guidelines[workflowType] || [];
    }

    showWorkflowGuide(guidance, workflow) {
        const guide = document.createElement('div');
        guide.className = 'hmi-workflow-guide';
        guide.innerHTML = `
            <div class="workflow-header">
                <h4>🔄 ${workflow.type.replace('_', ' ').toUpperCase()} Workflow</h4>
                <button class="close-guide" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="workflow-steps">
                ${guidance.map((step, index) => `
                    <div class="workflow-step ${index < workflow.progress ? 'completed' : ''}">
                        <span class="step-number">${index + 1}</span>
                        <span class="step-text">${step}</span>
                    </div>
                `).join('')}
            </div>
            <div class="workflow-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(workflow.progress / guidance.length) * 100}%"></div>
                </div>
            </div>
        `;
        
        guide.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: rgba(0,0,0,0.9);
            color: white;
            border-radius: 8px;
            padding: 16px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(guide);
        
        // Auto-remove after workflow completion
        setTimeout(() => {
            if (guide.parentElement) guide.remove();
        }, 30000);
    }

    trackWorkflowCompletion(workflowType, completionRate) {
        const record = {
            type: workflowType,
            completionRate,
            timestamp: performance.now(),
            duration: this.calculateWorkflowDuration(workflowType)
        };
        
        this.workflowHistory.push(record);
        
        // Limit history
        if (this.workflowHistory.length > 50) {
            this.workflowHistory.shift();
        }
        
        console.info(`📊 Workflow completed: ${workflowType} (${(completionRate * 100).toFixed(1)}%)`);
        
        // Analytics integration
        if (window.analyticsManager) {
            window.analyticsManager.trackWorkflow(workflowType, completionRate);
        }
    }

    /**
     * 📊 WORKFLOW ANALYTICS
     */
    getWorkflowMetrics() {
        const recentWorkflows = this.workflowHistory.slice(-10);
        
        const metrics = {
            totalWorkflows: this.workflowHistory.length,
            activeWorkflows: this.activeWorkflows.size,
            recentCompletionRate: this.calculateAverageCompletion(recentWorkflows),
            mostCommonWorkflow: this.findMostCommonWorkflow(),
            averageDuration: this.calculateAverageDuration(),
            workflowTypes: this.getWorkflowTypeDistribution()
        };
        
        return metrics;
    }

    calculateAverageCompletion(workflows) {
        if (workflows.length === 0) return 0;
        const total = workflows.reduce((sum, w) => sum + w.completionRate, 0);
        return total / workflows.length;
    }

    findMostCommonWorkflow() {
        const counts = new Map();
        this.workflowHistory.forEach(w => {
            counts.set(w.type, (counts.get(w.type) || 0) + 1);
        });
        
        let mostCommon = null;
        let maxCount = 0;
        
        counts.forEach((count, type) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = type;
            }
        });
        
        return { type: mostCommon, count: maxCount };
    }

    /**
     * 🔧 UTILITY METHODS
     */
    hasSelectedComponent() {
        return window.canvasSelectionManager?.getSelectedComponents().length > 0 || false;
    }

    hasMultipleComponents() {
        return document.querySelectorAll('.draggable-component').length > 1;
    }

    hasCompleteDesign() {
        return this.hasMultipleComponents() && this.hasConnections();
    }

    hasConnections() {
        return document.querySelectorAll('.connection-line, .component-connection').length > 0;
    }

    hasSimulatableComponents() {
        return document.querySelectorAll('[data-simulatable="true"], .pump, .valve, .sensor').length > 0;
    }

    isSimulationRunning() {
        return window.simulationManager?.isRunning || false;
    }

    hasExportableContent() {
        return this.hasMultipleComponents() || document.querySelector('svg') !== null;
    }

    generateWorkflowId() {
        return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    /**
     * 📊 CONTEXT OVERRIDES
     */
    getContextMetrics() {
        return {
            ...super.getContextMetrics(),
            ...this.getWorkflowMetrics(),
            workflowTemplatesCount: this.workflowTemplates.size
        };
    }

    /**
     * 🧹 CLEANUP
     */
    destroy() {
        this.activeWorkflows.clear();
        this.workflowHistory = [];
        this.workflowTemplates.clear();
        
        // Remove workflow guide elements
        document.querySelectorAll('.hmi-workflow-guide').forEach(el => el.remove());
        
        super.destroy();
    }
}

export default WorkflowRegistry;
