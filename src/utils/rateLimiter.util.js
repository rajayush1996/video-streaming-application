/**
 * Simple token bucket rate limiter implementation
 * Used to prevent overwhelming external services
 */
class RateLimiter {
    /**
   * Create a rate limiter
   * @param {Object} options - Rate limiter options
   * @param {number} options.tokensPerInterval - Tokens to add per interval
   * @param {string} options.interval - Interval type ('second', 'minute', 'hour', 'day')
   * @param {number} options.maxTokens - Maximum token bucket size (defaults to tokensPerInterval)
   * @param {boolean} options.fireImmediately - Allow initial requests immediately (defaults to true)
   */
    constructor(options) {
        this.tokensPerInterval = options.tokensPerInterval;
        this.interval = options.interval;
        this.maxTokens = options.maxTokens || options.tokensPerInterval;
    
        // Convert interval to milliseconds
        switch (this.interval) {
        case 'second':
            this.intervalMs = 1000;
            break;
        case 'minute':
            this.intervalMs = 60 * 1000;
            break;
        case 'hour':
            this.intervalMs = 60 * 60 * 1000;
            break;
        case 'day':
            this.intervalMs = 24 * 60 * 60 * 1000;
            break;
        default:
            throw new Error(`Invalid interval: ${this.interval}`);
        }
    
        // Initialize token bucket
        this.tokens = options.fireImmediately !== false ? this.maxTokens : 0;
        this.lastRefillTime = Date.now();
    }

    /**
   * Try to consume tokens
   * @param {number} tokens - Number of tokens to consume
   * @returns {Promise<Object>} - Result of consumption attempt
   */
    async tryConsume(tokens = 1) {
        this.refillTokens();
    
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return {
                success: true,
                remaining: this.tokens,
                consumedTokens: tokens
            };
        }
    
        // Calculate time until next token is available
        const tokensNeeded = tokens - this.tokens;
        const msPerToken = this.intervalMs / this.tokensPerInterval;
        const msBeforeNext = Math.ceil(tokensNeeded * msPerToken);
    
        return {
            success: false,
            remaining: this.tokens,
            msBeforeNext,
            consumedTokens: 0
        };
    }

    /**
   * Refill tokens based on elapsed time
   */
    refillTokens() {
        const now = Date.now();
        const elapsedMs = now - this.lastRefillTime;
    
        if (elapsedMs <= 0) {
            return;
        }
    
        // Calculate tokens to add
        const tokensToAdd = (elapsedMs / this.intervalMs) * this.tokensPerInterval;
    
        // Add tokens and cap at maximum
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    
        // Update last refill time
        this.lastRefillTime = now;
    }

    /**
   * Get current status
   * @returns {Object} - Current rate limiter status
   */
    getStatus() {
        this.refillTokens();
    
        return {
            tokens: this.tokens,
            maxTokens: this.maxTokens,
            tokensPerInterval: this.tokensPerInterval,
            interval: this.interval,
            lastRefillTime: this.lastRefillTime
        };
    }
}

module.exports = RateLimiter; 