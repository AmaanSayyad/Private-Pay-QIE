const crypto = require('crypto');

// Generate a random 32-byte private key
const privateKeyBytes = crypto.randomBytes(32);
const privateKey = '0x' + privateKeyBytes.toString('hex');

// Simple secp256k1 public key derivation (simplified)
console.log('=== YENİ QIE CÜZDAN ===');
console.log('Private Key:', privateKey);
console.log('');
console.log('Bu private key\'i güvenli bir yerde saklayın!');
console.log('QIE testnet\'ten token almak için bu private key\'den türetilen adresi kullanacağız.');
console.log('');
console.log('Şimdi bu private key\'i .env dosyasına ekleyeceğim...');