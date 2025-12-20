# 🔧 PrivatePay Troubleshooting Guide

## Common Issues and Solutions

---

### 🚨 JSON Parse Error: "Unexpected token 'P', 'Per anonym'..."

**Where**: Withdraw Funds page

**Real Cause**: **Aptos Testnet API rate limiting** - returns HTML (429 error) instead of JSON

**What It Looks Like**:
```
GET https://api.testnet.aptoslabs.com/v1/accounts/... 429 (Too Many Requests)
SyntaxError: Unexpected token 'P', "Per anonym"... is not valid JSON
```

**Solution**: ✅ **Already Fixed with Auto-Retry!** (See `APTOS_RATE_LIMIT_FIX.md`)

**What Happens Now**:
- ✅ Automatically retries 3 times with exponential backoff (1s → 2s → 4s)
- ✅ Shows you retry progress: "Rate limited. Retrying in 2s..."
- ✅ Usually succeeds after 1-2 retries
- ⚠️ If persistent rate limit, shows clear error message

**If You Still See This Error**:
1. **Wait 30-60 seconds** before trying again
2. Don't refresh the page repeatedly
3. Check if Aptos Testnet is experiencing issues: https://status.aptoslabs.com
4. Consider using a custom RPC endpoint (see below)

**For Production**: Use a custom RPC endpoint to avoid public API rate limits
```javascript
// Add to .env
VITE_APTOS_RPC_URL=https://your-rpc-endpoint.com
```

---

### ⏱️ Aptos API Rate Limiting

**Symptom**: "429 Too Many Requests" or repeated "Rate limited. Retrying..." messages

**Cause**: Exceeded Aptos Testnet public API rate limits (~100 requests/minute)

**Auto-Handling**: ✅ App automatically retries with exponential backoff

**If Persistent**:
1. **Wait 1-2 minutes** between attempts
2. Avoid refreshing the page rapidly
3. Don't make multiple transactions simultaneously
4. Check Aptos status: https://status.aptoslabs.com

**For Heavy Usage**:
Consider using a custom RPC endpoint:
- [Alchemy](https://www.alchemy.com/) - Free tier available
- [QuickNode](https://www.quicknode.com/) - Fast and reliable
- [NodeReal](https://nodereal.io/) - Multiple networks

**To Configure Custom RPC**:
```javascript
// In AptosWithdraw.jsx (or create env variable)
const config = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: "https://your-rpc-endpoint.com"
});
```

---

### 🔌 Backend Not Running (Port 3400)

**Symptom**: Backend API calls fail, but app still works

**Why It's OK**: The `squidl-backend` folder is **not required** for basic functionality!

**What Works Without Backend**:
- ✅ Stealth address generation
- ✅ Payment links
- ✅ Direct blockchain transactions
- ✅ Wallet connections
- ✅ Aptos transfers

**What Doesn't Work**:
- ❌ Username/alias checking via backend API
- ❌ Transaction history caching
- ❌ Asset management APIs

**Solution**: Use Supabase directly (already configured in frontend) or ignore backend entirely.

---

### 💾 Supabase Database Issues

**Symptoms**:
- Balance not updating
- "Database is unreachable" errors
- "Server returned HTML" errors

**Causes**:
1. Supabase project is down/paused
2. Tables don't exist
3. RLS (Row Level Security) blocking access
4. Invalid credentials

**Quick Fix**:
1. Check Supabase URL and key in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://dmqbcwxiabnuazsipnwl.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. Verify Supabase project is active at https://supabase.com/dashboard

3. Check required tables exist:
   - `users`
   - `balances`
   - `payments`
   - `payment_links`

**Workaround**: App will continue to work using direct blockchain queries. Balance tracking will be calculated locally.

---

### 🔑 Treasury Private Key Not Configured

**Error**: "Treasury private key not configured"

**Where**: Withdraw Funds page

**Cause**: `VITE_TREASURY_PRIVATE_KEY` is missing from `.env`

**Solution**:
1. Open `squidl-frontend/.env`
2. Add:
   ```
   VITE_TREASURY_PRIVATE_KEY=0xyour_private_key_here
   ```
3. Restart the dev server

**⚠️ Security Warning**: Never commit private keys to git!

---

### 🔗 "Cannot connect to Aptos wallet"

**Error**: "Aptos wallet not found. Please install Petra wallet."

**Cause**: Petra wallet extension not installed or not detected

**Solution**:
1. Install [Petra Wallet](https://petra.app/)
2. Create/import wallet
3. Switch to Testnet in wallet settings
4. Refresh the page

---

### 💰 "Insufficient balance" When Withdrawing

**Possible Causes**:

1. **Treasury wallet doesn't have funds**
   - Check treasury balance on Aptos Explorer
   - Fund the treasury wallet with test APT

2. **Balance in database doesn't match reality**
   - Database may be out of sync
   - Check actual balance on blockchain

**Solution**:
```javascript
// Check treasury balance
const treasuryAddress = import.meta.env.VITE_TREASURY_WALLET_ADDRESS;
// Visit: https://explorer.aptoslabs.com/account/TREASURY_ADDRESS?network=testnet
```

---

### 🌐 CORS Errors

**Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Where**: Backend API calls

**Cause**: Backend not configured for frontend origin

**Solution**: Backend already has CORS headers, but if running locally:
1. Make sure `VITE_BACKEND_URL` points to correct URL
2. Backend should allow `localhost:5173` origin

**Workaround**: Use Supabase directly (already configured)

---

### 📱 Wallet Connection Issues

**Symptoms**:
- "Connect Wallet" button doesn't work
- Wallet disconnects randomly
- "Account not found" errors

**Solutions**:

1. **Clear localStorage**:
   ```javascript
   // In browser console
   localStorage.clear();
   location.reload();
   ```

2. **Reset Petra Wallet**:
   - Disconnect from site in Petra settings
   - Reconnect

3. **Check Network**:
   - Ensure wallet is on **Testnet**
   - Check wallet has some APT for gas

---

### 🔄 Balance Not Updating

**Cause**: Multiple possible reasons

**Solutions**:

1. **Manual Refresh**:
   - Click refresh button
   - Or reload page

2. **Event Listener**:
   ```javascript
   window.dispatchEvent(new Event('balance-updated'));
   ```

3. **Clear Cache**:
   - Hard refresh: `Cmd/Ctrl + Shift + R`

4. **Check Blockchain**:
   - Verify actual balance on Aptos Explorer
   - Balance should be in treasury wallet

---

### 🎯 Photon SDK Errors

**Error**: "Photon tracking failed"

**Cause**: Missing or invalid Photon API keys

**Impact**: ⚠️ **Low** - Rewards won't track, but app works fine

**Solution**:
1. Add to `.env`:
   ```
   VITE_PHOTON_API_KEY=your_key_here
   VITE_PHOTON_CAMPAIGN_ID=your_campaign_id
   ```

2. Or ignore - it's optional for core functionality

---

## 🧪 Testing Your Setup

### 1. Check Environment Variables
```bash
cd squidl-frontend
cat .env | grep -v "KEY\|SECRET"  # Hide sensitive values
```

### 2. Check Frontend Running
```bash
# Should see: "Local: http://localhost:5173/"
curl http://localhost:5173/
```

### 3. Check Supabase Connection
Open browser console and run:
```javascript
// Check if Supabase is configured
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
```

### 4. Check Aptos Connection
```javascript
// Check if wallet is available
console.log("Aptos wallet:", window.aptos ? "Found" : "Not found");
```

---

## 📊 Health Check Checklist

- [ ] Frontend running on port 5173
- [ ] Petra wallet installed and connected
- [ ] Wallet on Aptos Testnet
- [ ] Supabase credentials in `.env`
- [ ] Aptos module address configured
- [ ] Treasury wallet address configured
- [ ] Treasury wallet has APT funds

---

## 🆘 Still Having Issues?

### Check Logs

1. **Browser Console**: `F12` → Console tab
2. **Network Tab**: Check failed requests
3. **Application Tab**: Check localStorage

### Common Log Messages

✅ **Good**:
```
✅ Supabase configuration present
✅ Treasury address: 0x...
✅ Transaction submitted: 0x...
```

⚠️ **Warnings** (App still works):
```
⚠️ Failed to update Supabase balance
⚠️ Photon tracking unavailable
⚠️ Backend API unreachable
```

❌ **Errors** (Need attention):
```
❌ Supabase configuration missing!
❌ Treasury private key not configured
❌ Aptos wallet not found
```

---

## 📚 Related Documentation

- [`WITHDRAW_JSON_ERROR_FIX.md`](./WITHDRAW_JSON_ERROR_FIX.md) - JSON parse error fix details
- [`PROJECT_RUNNING_STATUS.md`](./PROJECT_RUNNING_STATUS.md) - Service status
- [`README.md`](./README.md) - Getting started guide
- [`ENV_CHECK_REPORT.md`](./ENV_CHECK_REPORT.md) - Environment variables guide

---

## 💡 Pro Tips

1. **Always check the blockchain explorer** - It's the source of truth
2. **Balance tracking is optional** - Blockchain transactions are what matter
3. **Backend is not required** - Frontend works independently with Aptos
4. **Supabase failures are non-critical** - App continues to function
5. **Keep private keys secure** - Never commit to git

---

**Last Updated**: 2025-11-30

