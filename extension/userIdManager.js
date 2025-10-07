// User ID Management for Job Tracker Extension
class UserIdManager {
  constructor() {
    this.userId = null;
  }

  async init() {
    await this.loadUserId();
    return this.userId;
  }

  async loadUserId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userId', 'userIdSet'], (result) => {
        if (result.userIdSet && result.userId) {
          this.userId = result.userId;
          console.log('User ID loaded:', this.userId);
        } else {
          this.userId = null;
          console.log('No User ID set');
        }
        resolve(this.userId);
      });
    });
  }

  getUserId() {
    return this.userId;
  }

  setUserId(newUserId) {
    this.userId = newUserId;
    return chrome.storage.local.set({
      userId: newUserId,
      userIdSet: true,
      userIdSetAt: new Date().toISOString()
    });
  }

  clearUserId() {
    this.userId = null;
    return chrome.storage.local.remove(['userId', 'userIdSet', 'userIdSetAt']);
  }
}

// Make it globally available
window.UserIdManager = UserIdManager;