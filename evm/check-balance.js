const https = require('https');

const address = '0xf6becad1b5e17ff7184d02e88fb6f358e698c8de';
const rpcUrl = 'https://rpc1testnet.qie.digital/';

// JSON-RPC request to get balance
const requestData = JSON.stringify({
  jsonrpc: '2.0',
  method: 'eth_getBalance',
  params: [address, 'latest'],
  id: 1
});

const options = {
  hostname: 'rpc1testnet.qie.digital',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': requestData.length
  }
};

console.log('QIE Testnet bakiye kontrolü yapılıyor...');
console.log('Adres:', address);
console.log('RPC URL:', rpcUrl);
console.log('');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.log('❌ RPC Hatası:', response.error.message);
        console.log('Bu QIE testnet henüz aktif olmayabilir veya RPC URL yanlış olabilir.');
        return;
      }

      const balanceWei = response.result;
      const balanceHex = balanceWei;
      const balanceDec = parseInt(balanceHex, 16);
      const balanceQIE = balanceDec / Math.pow(10, 18);

      console.log('✅ Bakiye Bilgileri:');
      console.log('Wei (hex):', balanceHex);
      console.log('Wei (decimal):', balanceDec.toString());
      console.log('QIE:', balanceQIE.toFixed(6));
      
      if (balanceQIE > 0) {
        console.log('');
        console.log('🎉 Harika! Cüzdanda QIE token var. Deploy işlemine başlayabiliriz!');
      } else {
        console.log('');
        console.log('⚠️  Cüzdanda henüz token yok. Lütfen faucet\'ten token alın.');
      }
      
    } catch (error) {
      console.log('❌ Response parse hatası:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Bağlantı hatası:', error.message);
  console.log('QIE testnet RPC\'sine bağlanılamıyor. Network ayarlarını kontrol edin.');
});

req.write(requestData);
req.end();