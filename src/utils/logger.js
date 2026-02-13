/**
 * Lightweight test automation logger
 * 
 * Provides structured logging with levels, context, and control.
 * Designed for test automation - simple for QA engineers to use.
 * 
 * Usage:
 *   const logger = require('@utils/logger');
 *   logger.info('Flight search started', { from: 'LON', to: 'PAR' });
 *   logger.debug('Clicking element', { selector: '#submit-btn' });
 *   logger.error('Test failed', { error: err.message });
 * 
 * Environment variables:
 *   LOG_LEVEL: debug | info | warn | error | none (default: info)
 *   LOG_FORMAT: pretty | json (default: pretty)
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 999
};

const COLORS = {
  debug: '\x1b[36m',  // Cyan
  info: '\x1b[32m',   // Green
  warn: '\x1b[33m',   // Yellow
  error: '\x1b[31m',  // Red
  reset: '\x1b[0m'
};

class Logger {
  constructor() {
    this.level = this._getLogLevel();
    this.format = this._getLogFormat();
    this.component = null;
  }

  /**
   * Create a child logger with component context
   * @param {string} component - Component name (e.g., 'FlightSearch', 'Cart')
   * @returns {Logger} New logger instance with component context
   */
  child(component) {
    const childLogger = new Logger();
    childLogger.component = component;
    return childLogger;
  }

  /**
   * Log debug information (detailed technical info)
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    this._log('debug', message, context);
  }

  /**
   * Log informational messages (test flow, actions)
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    this._log('info', message, context);
  }

  /**
   * Log warnings (non-critical issues)
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    this._log('warn', message, context);
  }

  /**
   * Log errors (failures, exceptions)
   * @param {string} message - Log message
   * @param {Object} context - Additional context (should include error details)
   */
  error(message, context = {}) {
    this._log('error', message, context);
  }

  /**
   * Internal log method
   * @private
   */
  _log(level, message, context) {
    // Skip if below configured log level
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      component: this.component,
      message,
      ...context
    };

    if (this.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      this._prettyPrint(level, entry);
    }
  }

  /**
   * Pretty print for human readability (local development)
   * @private
   */
  _prettyPrint(level, entry) {
    const color = COLORS[level];
    const reset = COLORS.reset;
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const component = entry.component ? `[${entry.component}]` : '';
    
    let output = `${color}${level.toUpperCase().padEnd(5)}${reset} ${time} ${component} ${entry.message}`;
    
    // Add context if present
    const contextKeys = Object.keys(entry).filter(k => 
      !['timestamp', 'level', 'component', 'message'].includes(k)
    );
    
    if (contextKeys.length > 0) {
      const contextStr = contextKeys
        .map(k => `${k}=${JSON.stringify(entry[k])}`)
        .join(' ');
      output += ` ${contextStr}`;
    }

    console.log(output);
  }

  /**
   * Get configured log level from environment
   * @private
   */
  _getLogLevel() {
    const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
    return LOG_LEVELS[level] !== undefined ? level : 'info';
  }

  /**
   * Get configured log format from environment
   * @private
   */
  _getLogFormat() {
    const format = (process.env.LOG_FORMAT || 'pretty').toLowerCase();
    return ['pretty', 'json'].includes(format) ? format : 'pretty';
  }
}

// Export singleton instance
const logger = new Logger();

module.exports = logger;
