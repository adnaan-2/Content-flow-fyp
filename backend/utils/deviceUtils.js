const UAParser = require('ua-parser-js');

// Helper function to get device information from user agent
const getDeviceInfo = (userAgent, ip) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || '',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    device: result.device.type || 'desktop',
    deviceModel: result.device.model || '',
    ip: ip || 'Unknown'
  };
};

// Create a unique device fingerprint
const createDeviceFingerprint = (deviceInfo) => {
  return `${deviceInfo.browser}-${deviceInfo.os}-${deviceInfo.ip}`.toLowerCase().replace(/\s+/g, '');
};

// Check if this is a new device for the user
const isNewDevice = (user, deviceFingerprint) => {
  if (!user.knownDevices || user.knownDevices.length === 0) {
    return true;
  }
  
  return !user.knownDevices.some(device => device.fingerprint === deviceFingerprint);
};

// Add device to user's known devices
const addKnownDevice = async (user, deviceInfo, deviceFingerprint) => {
  const deviceRecord = {
    fingerprint: deviceFingerprint,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    lastUsed: new Date(),
    firstSeen: new Date()
  };
  
  if (!user.knownDevices) {
    user.knownDevices = [];
  }
  
  // Remove old entry if exists and add new one
  user.knownDevices = user.knownDevices.filter(device => device.fingerprint !== deviceFingerprint);
  user.knownDevices.push(deviceRecord);
  
  // Keep only last 10 devices to prevent data bloat
  if (user.knownDevices.length > 10) {
    user.knownDevices = user.knownDevices
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 10);
  }
  
  await user.save();
};

// Update last used time for existing device
const updateDeviceLastUsed = async (user, deviceFingerprint) => {
  if (!user.knownDevices) return;
  
  const device = user.knownDevices.find(d => d.fingerprint === deviceFingerprint);
  if (device) {
    device.lastUsed = new Date();
    await user.save();
  }
};

// Get location from IP (basic implementation - you can enhance with IP geolocation service)
const getLocationFromIP = (ip) => {
  // This is a basic implementation
  // For production, consider using services like:
  // - MaxMind GeoIP2
  // - ipapi.co
  // - ip-api.com
  
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local/Private Network';
  }
  
  return 'Unknown Location';
};

module.exports = {
  getDeviceInfo,
  createDeviceFingerprint,
  isNewDevice,
  addKnownDevice,
  updateDeviceLastUsed,
  getLocationFromIP
};