// Monitor class for tracking extension components
class ExtensionMonitor {
  constructor() {
    this.components = new Map();
    this.messageLog = [];
    this.MAX_LOG_SIZE = 100;
    this.initializeMonitoring();
  }

  // Initialize monitoring
  initializeMonitoring() {
    // Monitor runtime messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.logMessage('runtime', message, sender);
      return false; // Don't block other listeners
    });

    // Monitor storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      this.logStorageChange(changes, namespace);
    });

    // Monitor tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.logTabUpdate(tabId, changeInfo);
    });
  }

  // Register a component
  registerComponent(name, status = 'active') {
    this.components.set(name, {
      status,
      lastActive: Date.now(),
      errors: [],
      messageCount: 0
    });
    this.logEvent('component', `Component registered: ${name}`);
  }

  // Update component status
  updateComponentStatus(name, status) {
    if (this.components.has(name)) {
      const component = this.components.get(name);
      component.status = status;
      component.lastActive = Date.now();
      this.logEvent('status', `Component ${name} status updated to ${status}`);
    }
  }

  // Log message
  logMessage(type, message, sender) {
    const logEntry = {
      timestamp: Date.now(),
      type,
      message,
      sender: sender?.tab ? `Tab ${sender.tab.id}` : 'Extension'
    };

    this.messageLog.unshift(logEntry);
    if (this.messageLog.length > this.MAX_LOG_SIZE) {
      this.messageLog.pop();
    }

    // Update component message count if sender is known
    if (sender?.tab) {
      const componentName = `content_script_${sender.tab.id}`;
      if (this.components.has(componentName)) {
        this.components.get(componentName).messageCount++;
      }
    }
  }

  // Log storage change
  logStorageChange(changes, namespace) {
    const logEntry = {
      timestamp: Date.now(),
      type: 'storage',
      namespace,
      changes: Object.keys(changes).reduce((acc, key) => {
        acc[key] = {
          oldValue: changes[key].oldValue,
          newValue: changes[key].newValue
        };
        return acc;
      }, {})
    };

    this.messageLog.unshift(logEntry);
    if (this.messageLog.length > this.MAX_LOG_SIZE) {
      this.messageLog.pop();
    }
  }

  // Log tab update
  logTabUpdate(tabId, changeInfo) {
    this.logEvent('tab', `Tab ${tabId} updated: ${JSON.stringify(changeInfo)}`);
  }

  // Log general event
  logEvent(type, message) {
    const logEntry = {
      timestamp: Date.now(),
      type,
      message
    };

    this.messageLog.unshift(logEntry);
    if (this.messageLog.length > this.MAX_LOG_SIZE) {
      this.messageLog.pop();
    }
  }

  // Log error
  logError(componentName, error) {
    if (this.components.has(componentName)) {
      const component = this.components.get(componentName);
      component.errors.push({
        timestamp: Date.now(),
        error: error.message || error
      });
      this.logEvent('error', `Error in ${componentName}: ${error.message || error}`);
    }
  }

  // Get component status
  getComponentStatus(name) {
    return this.components.get(name);
  }

  // Get all components status
  getAllComponentsStatus() {
    return Object.fromEntries(this.components);
  }

  // Get recent logs
  getRecentLogs(count = 10) {
    return this.messageLog.slice(0, count);
  }

  // Get component errors
  getComponentErrors(name) {
    return this.components.get(name)?.errors || [];
  }

  // Clear logs
  clearLogs() {
    this.messageLog = [];
    this.logEvent('system', 'Logs cleared');
  }

  // Check component health
  checkComponentHealth(name) {
    const component = this.components.get(name);
    if (!component) return 'unknown';

    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
    const isActive = Date.now() - component.lastActive < inactiveThreshold;
    const hasRecentErrors = component.errors.some(
      error => Date.now() - error.timestamp < inactiveThreshold
    );

    if (!isActive) return 'inactive';
    if (hasRecentErrors) return 'error';
    return 'healthy';
  }
}

// Create and export monitor instance
const monitor = new ExtensionMonitor();
export default monitor; 