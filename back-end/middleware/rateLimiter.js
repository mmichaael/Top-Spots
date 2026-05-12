
class RateLimiter {
    constructor() {
        // Store for per-user, per-endpoint tracking: { userId_endpoint: [timestamps] }
        this.requestHistory = new Map();
        
        // Store for violation tracking: { ip: { violationCount, blockedUntil } }
        this.violations = new Map();
        
        // Cleanup old entries every 15 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 15 * 60 * 1000);
        
        // Configuration
        this.SEARCH_LIMIT = 7;           // requests per minute for search endpoints
        this.SEARCH_WINDOW = 60 * 1000;  // 1 minute in milliseconds
        this.GLOBAL_LIMIT = 100;         // requests per 10 minutes globally
        this.GLOBAL_WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds
        this.VIOLATION_THRESHOLD = 30;   // violations in VIOLATION_CHECK_WINDOW
        this.VIOLATION_CHECK_WINDOW = 60 * 1000; // 1 minute
        this.IP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour
    }

    /**
     * Get user ID from request (extracted from JWT by checkValidityAccessToken middleware)
     */
    getUserId(req) {
        return req.user?.user_id || req.email || 'anonymous';
    }

    /**
     * Get client IP address
     */
    getClientIp(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.connection.socket?.remoteAddress ||
               'unknown';
    }

    /**
     * Check if IP is currently blocked
     */
    isIpBlocked(ip) {
        const violation = this.violations.get(ip);
        if (!violation) return false;
        
        if (violation.blockedUntil && Date.now() < violation.blockedUntil) {
            return true;
        }
        
        // Block has expired
        if (violation.blockedUntil && Date.now() >= violation.blockedUntil) {
            this.violations.delete(ip);
            return false;
        }
        
        return false;
    }

    /**
     * Get remaining time until IP is unblocked (in seconds)
     */
    getBlockedTimeRemaining(ip) {
        const violation = this.violations.get(ip);
        if (!violation || !violation.blockedUntil) return 0;
        
        const remaining = Math.ceil((violation.blockedUntil - Date.now()) / 1000);
        return Math.max(0, remaining);
    }

    /**
     * Record a violation for an IP
     */
    recordViolation(ip) {
        if (!this.violations.has(ip)) {
            this.violations.set(ip, { violationCount: 0, blockedUntil: null });
        }
        
        const violation = this.violations.get(ip);
        violation.violationCount = (violation.violationCount || 0) + 1;
        
        // Auto-block if violation threshold reached
        if (violation.violationCount >= this.VIOLATION_THRESHOLD) {
            violation.blockedUntil = Date.now() + this.IP_BLOCK_DURATION;
            console.warn(`IP BLOCKED: ${ip} (${violation.violationCount} violations in ${this.VIOLATION_CHECK_WINDOW}ms)`);
        }
    }

    /**
     * Main rate limiting check
     * @param {string} endpoint
     * @param {number} limit - Request limit for this endpoint
     * @param {number} window - Time window in milliseconds
     */
    check(endpoint, limit, window) {
        return (req, res, next) => {
            const userId = this.getUserId(req);
            const ip = this.getClientIp(req);
            
            // Check if IP is blocked
            if (this.isIpBlocked(ip)) {
                const remaining = this.getBlockedTimeRemaining(ip);
                res.set('Retry-After', remaining.toString());
                return res.status(429).json({
                    success: false,
                    error: '⛔ Ваша IP-адреса заблокована через багато спроб. Спробуйте пізніше.',
                    retryAfter: remaining,
                    endpoint
                });
            }
            
            const key = `${userId}_${endpoint}`;
            const now = Date.now();
            
            // Get request history for this user and endpoint
            if (!this.requestHistory.has(key)) {
                this.requestHistory.set(key, []);
            }
            
            let timestamps = this.requestHistory.get(key);
            
            // Remove old timestamps outside the window
            timestamps = timestamps.filter(timestamp => now - timestamp < window);
            
            // Check if limit exceeded
            if (timestamps.length >= limit) {
                this.recordViolation(ip);
                const retryAfter = Math.ceil((window - (now - timestamps[0])) / 1000);
                res.set('Retry-After', retryAfter.toString());
                return res.status(429).json({
                    success: false,
                    error: `⏱️ Перевищено ліміт запитів. Спробуйте через ${retryAfter} секунд.`,
                    limit,
                    window,
                    retryAfter,
                    endpoint
                });
            }
            
            // Record this request
            timestamps.push(now);
            this.requestHistory.set(key, timestamps);
            
            // Log for monitoring
            console.log(`✓ Rate limit: ${endpoint} | User: ${userId} | IP: ${ip} | ${timestamps.length}/${limit}`);
            
            next();
        };
    }

    /**
     * Search endpoint rate limiter (7 per minute)
     */
    searchLimiter(endpoint) {
        return this.check(endpoint, this.SEARCH_LIMIT, this.SEARCH_WINDOW);
    }

    /**
     * Autocomplete endpoint rate limiter (30 per minute)
     */
    autocompleteLimiter(endpoint) {
        return this.check(endpoint, 30, this.SEARCH_WINDOW);
    }

    /**
     * Global rate limiter (100 per 10 minutes)
     */
    globalLimiter(endpoint) {
        return this.check(endpoint, this.GLOBAL_LIMIT, this.GLOBAL_WINDOW);
    }

    /**
     * Cleanup old entries from memory to prevent memory leak
     */
    cleanup() {
        const now = Date.now();
        
        // Clean up request history
        for (const [key, timestamps] of this.requestHistory.entries()) {
            const validTimestamps = timestamps.filter(
                timestamp => now - timestamp < this.GLOBAL_WINDOW
            );
            
            if (validTimestamps.length === 0) {
                this.requestHistory.delete(key);
            } else {
                this.requestHistory.set(key, validTimestamps);
            }
        }
        
        // Clean up violations
        for (const [ip, violation] of this.violations.entries()) {
            if (violation.blockedUntil && now >= violation.blockedUntil) {
                this.violations.delete(ip);
            }
        }
        
        console.log(`🧹 Rate limiter cleanup: ${this.requestHistory.size} active users, ${this.violations.size} tracked IPs`);
    }

    /**
     * Get statistics about current rate limiter state
     */
    getStats() {
        return {
            activeTrackedUsers: this.requestHistory.size,
            blockedIps: Array.from(this.violations.entries())
                .filter(([_, v]) => v.blockedUntil && Date.now() < v.blockedUntil)
                .length,
            totalTrackedIps: this.violations.size,
            config: {
                searchLimit: `${this.SEARCH_LIMIT}/${Math.floor(this.SEARCH_WINDOW / 1000)}s`,
                globalLimit: `${this.GLOBAL_LIMIT}/${Math.floor(this.GLOBAL_WINDOW / 1000)}s`,
                ipBlockDuration: `${Math.floor(this.IP_BLOCK_DURATION / 1000 / 60)}min`
            }
        };
    }

    /**
     * Destroy the rate limiter (clear interval)
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Export singleton instance
module.exports = new RateLimiter();
