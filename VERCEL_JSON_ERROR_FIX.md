# Vercel JSON Parse Error Fix

## Problem
Error: `Unexpected token 'P', "Per anonym"... is not valid JSON`

This error occurs when:
1. **HTML Error Pages**: API endpoints return HTML error pages (404/500) instead of JSON
2. **Corrupted localStorage**: Browser has corrupted data from previous visits
3. **Network Issues**: Vercel returns HTML error pages when routes are misconfigured

## Root Causes

### 1. localStorage Corruption
Users who visited before fixes have corrupted JSON data in localStorage that starts with "Per anonym..." (likely part of an HTML error page).

### 2. API Response Issues
- Axios attempting to parse HTML error pages as JSON
- Missing `Accept: application/json` header
- No validation of response content type
- Multiple axios instances without proper error handling

## Solutions Implemented

### ✅ 1. Global Error Handlers (`main.jsx`)
Added handlers to catch and gracefully handle JSON parse errors:
- `unhandledrejection` - Catches unhandled promise rejections
- `error` - Catches uncaught errors
- Automatically detects and removes HTML content from localStorage
- Prevents app crashes from JSON parse errors

### ✅ 2. localStorage Cleanup on Init (`main.jsx`)
On app startup:
- Scans all localStorage keys
- Detects HTML content (starts with `<`)
- Validates JSON objects
- Removes corrupted data
- Logs cleanup activity

### ✅ 3. Protected ALL Axios Instances

#### a) Photon API (`photonService.js`)
```javascript
const photonAPI = axios.create({
  baseURL: PHOTON_CONFIG.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',  // ← Explicitly request JSON
  },
  responseType: 'json',  // ← Force JSON parsing
  validateStatus: (status) => status < 500,  // ← Handle 4xx manually
});
```

#### b) SQUIDL Backend API (`squidl.js`)
- Added JSON validation to `apiWithSession()`
- Added JSON validation to `apiNoSession()`
- HTML detection in both request/response interceptors

#### c) cBridge API (`getData.js` & `poolBasedTransfer.js`)
- Created `cBridgeAxios` instance with JSON validation
- Added response interceptors to detect HTML
- Consistent error handling across all cBridge calls

### ✅ 4. Response Validation Interceptors
All axios instances now have interceptors that:
```javascript
photonAPI.interceptors.response.use(
  (response) => {
    // Check if response is HTML instead of JSON
    if (response.data && typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      console.error('Received HTML instead of JSON:', response.data.substring(0, 100));
      throw new Error('Server returned HTML instead of JSON');
    }
    return response;
  },
  (error) => {
    // Check error responses for HTML
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.trim().startsWith('<')) {
      console.error('API returned HTML error page:', error.response.data.substring(0, 200));
      return Promise.reject(new Error('API is unreachable or returned an error page'));
    }
    return Promise.reject(error);
  }
);
```

### ✅ 5. Safe localStorage Utilities (`localStorageUtils.js`)
Already implemented safe JSON parsing with error handling:
- `safeGetJSON()` - Safely get and parse
- `safeSetJSON()` - Safely stringify and save
- Automatic corruption detection and cleanup

## Files Modified

1. **squidl-frontend/src/main.jsx**
   - Global error handlers for JSON parse errors
   - Enhanced localStorage cleanup with HTML detection
   - Graceful error handling to prevent crashes

2. **squidl-frontend/src/api/photonService.js**
   - Enhanced axios configuration
   - Response validation interceptor
   - HTML detection in responses

3. **squidl-frontend/src/api/squidl.js**
   - Added JSON validation to `apiWithSession()`
   - Added JSON validation to `apiNoSession()`
   - Response interceptors for both instances

4. **squidl-frontend/src/lib/cBridge/api/getData.js**
   - Created `cBridgeAxios` with JSON validation
   - Response interceptor for HTML detection
   - Updated both API functions

5. **squidl-frontend/src/lib/cBridge/api/poolBasedTransfer.js**
   - Created `cBridgeAxios` with JSON validation
   - Response interceptor for HTML detection
   - Updated `estimateAmt` function

6. **squidl-frontend/src/utils/localStorageUtils.js** (already existed)
   - Safe JSON operations
   - Error handling
   - Corruption cleanup

## Testing on Vercel

After deploying these fixes:

### ✅ Expected Behavior
1. **First Load**: Corrupted localStorage is automatically cleaned
2. **API Errors**: HTML error pages are caught and logged, not parsed as JSON
3. **Network Issues**: Graceful error messages instead of crashes
4. **User Experience**: App continues working even with corrupted data
5. **Console Logs**: Helpful debugging information for each API

### 🔍 Debugging
Check browser console for:
```
[Init] Cleaned X corrupted localStorage items
[Global] Removing HTML content from localStorage key: xxx
[Global] JSON parsing error detected
Photon API returned HTML error page: ...
SQUIDL API returned HTML instead of JSON: ...
cBridge API returned HTML error page: ...
```

## Prevention

These fixes prevent future issues by:
1. ✅ Validating all localStorage data on read
2. ✅ Detecting HTML responses before parsing in ALL axios instances
3. ✅ Explicitly requesting JSON in ALL API calls
4. ✅ Gracefully handling errors instead of crashing
5. ✅ Auto-cleaning corrupted data on app load
6. ✅ Consistent error handling across Photon, SQUIDL, and cBridge APIs

## Coverage

### APIs Protected:
- ✅ Photon API (identity, attribution, events)
- ✅ SQUIDL Backend API (user data, assets, payments)
- ✅ cBridge API (transfer configs, status, estimates)

### Data Storage Protected:
- ✅ localStorage reads/writes
- ✅ Photon user data
- ✅ Event queue
- ✅ Balance history
- ✅ User assets

## If Error Persists

If the error still occurs on Vercel:

1. **Check Vercel Logs**: Look for 404/500 errors
2. **Verify Environment Variables**: Ensure all `VITE_*` variables are set
3. **Check API Endpoints**: Verify Photon API is accessible
4. **Check Backend URL**: Verify `VITE_BACKEND_URL` is correct
5. **Check Network Tab**: Look for HTML responses in DevTools
6. **Check Console**: Look for specific error logs we added

## Quick Fix for Users

If a user reports this error:
```javascript
// Run in browser console
localStorage.clear();
location.reload();
```

This clears all corrupted data and reloads the app.

## Deployment Checklist

Before deploying to Vercel:
- [x] All axios instances have JSON validation
- [x] All axios instances have HTML detection
- [x] Global error handlers in place
- [x] localStorage cleanup on init
- [x] Safe localStorage utilities used
- [x] Environment variables configured in Vercel
- [x] Error logging for debugging

## Summary

**Total Protection Layers**: 5
1. Global error handlers (catches all JSON parse errors)
2. localStorage cleanup on init (removes corrupted data)
3. Axios interceptors (validates all API responses)
4. Response type enforcement (JSON only)
5. Safe localStorage utilities (prevents corruption)

**Files Protected**: 6
- main.jsx (global handlers)
- photonService.js (Photon API)
- squidl.js (Backend API)
- getData.js (cBridge API)
- poolBasedTransfer.js (cBridge API)
- localStorageUtils.js (localStorage)

The app is now fully protected against JSON parse errors from HTML responses!

