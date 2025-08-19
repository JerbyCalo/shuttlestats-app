// Shared data persistence utilities
export class DataPersistence {
  static getUserEmail() {
    return localStorage.getItem('userEmail') || 'practice@gmail.com';
  }

  static loadUserData(dataType) {
    const userEmail = this.getUserEmail();
    const key = `${dataType}_${userEmail}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  static saveUserData(dataType, data) {
    const userEmail = this.getUserEmail();
    const key = `${dataType}_${userEmail}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  static clearUserData(dataType) {
    const userEmail = this.getUserEmail();
    const key = `${dataType}_${userEmail}`;
    localStorage.removeItem(key);
  }

  // Common remote vs local data handling pattern
  static async handleDataOperation(remote, operation, localFallback) {
    if (remote && window.dataService && typeof window.dataService[operation] === 'function') {
      try {
        return await window.dataService[operation]();
      } catch (err) {
        console.error(`Failed ${operation}:`, err);
        if (localFallback) return localFallback();
        throw err;
      }
    } else {
      if (localFallback) return localFallback();
      throw new Error(`Operation ${operation} not available`);
    }
  }
}
