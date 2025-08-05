/**
 * PATTERN MATCHER - Advanced Pattern Recognition Engine
 * Native JS pattern matching with fuzzy logic
 */

export class PatternMatcher {
    constructor(options = {}) {
        this.tolerance = options.tolerance || 0.3;
        this.performanceMode = options.performanceMode || false;
        this.cache = new Map();
    }

    /**
     * 🎯 PATTERN MATCHING
     */
    match(pattern, data, options = {}) {
        const cacheKey = this.generateCacheKey(pattern, data);
        
        if (this.cache.has(cacheKey) && !options.ignoreCache) {
            return this.cache.get(cacheKey);
        }

        const result = this.performMatch(pattern, data, options);
        
        if (!options.ignoreCache) {
            this.cache.set(cacheKey, result);
            
            // Limit cache size
            if (this.cache.size > 100) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
        }

        return result;
    }

    performMatch(pattern, data, options) {
        switch (pattern.type) {
            case 'spatial':
                return this.matchSpatialPattern(pattern, data, options);
            case 'temporal':
                return this.matchTemporalPattern(pattern, data, options);
            case 'sequence':
                return this.matchSequencePattern(pattern, data, options);
            case 'fuzzy':
                return this.matchFuzzyPattern(pattern, data, options);
            default:
                return { matches: false, confidence: 0 };
        }
    }

    /**
     * 🗺️ SPATIAL PATTERN MATCHING
     */
    matchSpatialPattern(pattern, data, options) {
        const { shape, coordinates, tolerance = this.tolerance } = pattern;
        
        if (!data.points || data.points.length < 3) {
            return { matches: false, confidence: 0 };
        }

        switch (shape) {
            case 'circle':
                return this.matchCirclePattern(data.points, coordinates, tolerance);
            case 'rectangle':
                return this.matchRectanglePattern(data.points, coordinates, tolerance);
            case 'line':
                return this.matchLinePattern(data.points, coordinates, tolerance);
            default:
                return { matches: false, confidence: 0 };
        }
    }

    matchCirclePattern(points, expected, tolerance) {
        const center = this.calculateCentroid(points);
        const avgRadius = this.calculateAverageRadius(points, center);
        
        const centerDistance = this.distance(center, expected.center);
        const radiusDiff = Math.abs(avgRadius - expected.radius);
        
        const centerMatch = centerDistance <= expected.radius * tolerance;
        const radiusMatch = radiusDiff <= expected.radius * tolerance;
        
        const confidence = Math.max(0, 1 - (centerDistance + radiusDiff) / (expected.radius * 2));
        
        return {
            matches: centerMatch && radiusMatch && confidence > 0.5,
            confidence,
            detected: { center, radius: avgRadius },
            expected
        };
    }

    /**
     * ⏰ TEMPORAL PATTERN MATCHING
     */
    matchTemporalPattern(pattern, data, options) {
        const { duration, intervals, tolerance = this.tolerance } = pattern;
        
        if (!data.events || data.events.length < 2) {
            return { matches: false, confidence: 0 };
        }

        const actualDuration = data.events[data.events.length - 1].timestamp - data.events[0].timestamp;
        const durationMatch = Math.abs(actualDuration - duration) <= duration * tolerance;
        
        let intervalMatches = 0;
        for (let i = 1; i < data.events.length; i++) {
            const actualInterval = data.events[i].timestamp - data.events[i - 1].timestamp;
            const expectedInterval = intervals[Math.min(i - 1, intervals.length - 1)];
            
            if (Math.abs(actualInterval - expectedInterval) <= expectedInterval * tolerance) {
                intervalMatches++;
            }
        }
        
        const intervalConfidence = intervalMatches / (data.events.length - 1);
        const durationConfidence = durationMatch ? 1 : 0;
        const confidence = (intervalConfidence + durationConfidence) / 2;
        
        return {
            matches: confidence > 0.7,
            confidence,
            intervalMatches,
            durationMatch
        };
    }

    /**
     * 🔄 SEQUENCE PATTERN MATCHING
     */
    matchSequencePattern(pattern, data, options) {
        const { sequence, allowGaps = false, maxGapSize = 1000 } = pattern;
        
        if (!data.sequence || data.sequence.length < sequence.length) {
            return { matches: false, confidence: 0 };
        }

        let matches = 0;
        let sequenceIndex = 0;
        let lastMatchTime = 0;
        
        for (const event of data.sequence) {
            if (sequenceIndex >= sequence.length) break;
            
            const expectedEvent = sequence[sequenceIndex];
            const gap = event.timestamp - lastMatchTime;
            
            if (this.eventsMatch(event, expectedEvent)) {
                if (!allowGaps || gap <= maxGapSize || lastMatchTime === 0) {
                    matches++;
                    sequenceIndex++;
                    lastMatchTime = event.timestamp;
                }
            }
        }
        
        const confidence = matches / sequence.length;
        
        return {
            matches: confidence >= 0.8,
            confidence,
            matchedEvents: matches,
            totalEvents: sequence.length
        };
    }

    /**
     * 🌫️ FUZZY PATTERN MATCHING
     */
    matchFuzzyPattern(pattern, data, options) {
        const { features, weights = {} } = pattern;
        
        let totalScore = 0;
        let totalWeight = 0;
        
        for (const [feature, expectedValue] of Object.entries(features)) {
            const actualValue = data[feature];
            const weight = weights[feature] || 1;
            
            const score = this.calculateFuzzyScore(expectedValue, actualValue);
            totalScore += score * weight;
            totalWeight += weight;
        }
        
        const confidence = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        return {
            matches: confidence > 0.6,
            confidence,
            features: Object.keys(features),
            scores: features
        };
    }

    /**
     * 🔧 UTILITY METHODS
     */
    calculateCentroid(points) {
        const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        return { x: sum.x / points.length, y: sum.y / points.length };
    }

    calculateAverageRadius(points, center) {
        const distances = points.map(p => this.distance(p, center));
        return distances.reduce((sum, d) => sum + d, 0) / distances.length;
    }

    distance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    eventsMatch(event1, event2) {
        return event1.type === event2.type && 
               (!event2.data || this.objectsMatch(event1.data, event2.data));
    }

    objectsMatch(obj1, obj2) {
        for (const key in obj2) {
            if (obj1[key] !== obj2[key]) return false;
        }
        return true;
    }

    calculateFuzzyScore(expected, actual) {
        if (typeof expected === 'number' && typeof actual === 'number') {
            const diff = Math.abs(expected - actual);
            const range = Math.max(expected, actual) || 1;
            return Math.max(0, 1 - diff / range);
        }
        
        if (typeof expected === 'string' && typeof actual === 'string') {
            return expected === actual ? 1 : 0;
        }
        
        return expected === actual ? 1 : 0;
    }

    generateCacheKey(pattern, data) {
        return `${JSON.stringify(pattern)}_${JSON.stringify(data)}`;
    }

    /**
     * 🧹 CLEANUP
     */
    clearCache() {
        this.cache.clear();
    }

    destroy() {
        this.clearCache();
    }
}

export default PatternMatcher;
