/**
 * Test treasury wallet functionality
 */

const { ethers } = require('ethers');

const TREASURY_ADDRESS = '0x5b9CA1abaBb1bbF294d20615B82B9Dd9EAe3cfa1';
const TREASURY_PRIVATE_KEY = '0x5675e0f2359b9563165d764474fe5fdcb009cd9613e6294e4b7a9e48893d18ee';
const RPC_URL = 'https://rpc1testnet.qie.digital/';

async function testTreasury() {
  try {
    console.log('🔍 Treasury Wallet Test Başlıyor...\n');
    
    // Provider oluştur
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Wallet oluştur
    const wallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);
    
    console.log('📋 Treasury Bilgileri:');
    console.log('Address:', TREASURY_ADDRESS);
    console.log('Computed Address:', wallet.address);
    console.log('Address Match:', wallet.address.toLowerCase() === TREASURY_ADDRESS.toLowerCase());
    
    // Balance kontrol et
    const balance = await provider.getBalance(TREASURY_ADDRESS);
    console.log('\n💰 Balance:');
    console.log('Wei:', balance.toString());
    console.log('QIE:', ethers.formatEther(balance));
    
    // Network bilgileri
    const network = await provider.getNetwork();
    console.log('\n🌐 Network:');
    console.log('Chain ID:', network.chainId.toString());
    console.log('Name:', network.name);
    
    // Gas price
    const gasPrice = await provider.getFeeData();
    console.log('\n⛽ Gas Info:');
    console.log('Gas Price:', gasPrice.gasPrice?.toString());
    console.log('Max Fee Per Gas:', gasPrice.maxFeePerGas?.toString());
    
    // Address validation test
    console.log('\n✅ Address Validation:');
    console.log('Is Valid Address:', ethers.isAddress(TREASURY_ADDRESS));
    console.log('Address Length:', TREASURY_ADDRESS.length);
    console.log('Starts with 0x:', TREASURY_ADDRESS.startsWith('0x'));
    
    console.log('\n🎉 Treasury wallet test completed successfully!');
    
  } catch (error) {
    console.error('❌ Treasury test failed:', error);
  }
}

testTreasury();