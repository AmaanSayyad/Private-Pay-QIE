/**
 * QIE Event Monitor Service
 * Handles real-time monitoring of QIE blockchain events and database updates
 */

import { ethers } from 'ethers';
import { qieBlockchainService } from './qieBlockchainService.js';
import { supabase } from '../supabase.js';

class QIEEventMonitor {
  constructor() {
    this.isMonitoring = false;
    this.eventListeners = new Map();
    this.lastProcessedBlock = 0;
    this.batchSize = 100; // Process events in batches
    this.pollInterval = 5000; // 5 seconds
    this.pollTimer = null;
  }

  /**
   * Start monitoring QIE blockchain events
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Event monitoring is already running');
      return;
    }

    try {
      // Initialize blockchain service if not already done
      if (!qieBlockchainService.isInitialized) {
        await qieBlockchainService.initialize();
      }

      // Get the last processed block from database
      await this.loadLastProcessedBlock();

      // Start real-time event listening
      this.setupEventListeners();

      // Start polling for missed events
      this.startPolling();

      this.isMonitoring = true;
      console.log('QIE event monitoring started');
    } catch (error) {
      console.error('Failed to start event monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring QIE blockchain events
   */
  async stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    try {
      // Stop real-time listeners
      qieBlockchainService.stopEventMonitoring();
      this.eventListeners.clear();

      // Stop polling
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }

      this.isMonitoring = false;
      console.log('QIE event monitoring stopped');
    } catch (error) {
      console.error('Error stopping event monitoring:', error);
    }
  }

  /**
   * Setup real-time event listeners
   */
  setupEventListeners() {
    // Listen for payment announcements
    qieBlockchainService.startEventMonitoring(async (paymentEvent) => {
      try {
        await this.processPaymentEvent(paymentEvent);
      } catch (error) {
        console.error('Error processing real-time payment event:', error);
      }
    });

    // Listen for meta address registrations
    if (qieBlockchainService.registryContract) {
      const metaAddressFilter = qieBlockchainService.registryContract.filters.MetaAddressRegistered();
      
      qieBlockchainService.registryContract.on(metaAddressFilter, async (user, index, spendPubKey, viewingPubKey, timestamp, event) => {
        try {
          const metaAddressEvent = {
            user,
            index: Number(index),
            spendPubKey,
            viewingPubKey,
            timestamp: Number(timestamp),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
          
          await this.processMetaAddressEvent(metaAddressEvent);
        } catch (error) {
          console.error('Error processing meta address event:', error);
        }
      });
    }

    // Listen for stealth withdrawals
    if (qieBlockchainService.paymentContract) {
      const withdrawalFilter = qieBlockchainService.paymentContract.filters.StealthWithdrawal();
      
      qieBlockchainService.paymentContract.on(withdrawalFilter, async (stealthAddress, recipient, amount, timestamp, event) => {
        try {
          const withdrawalEvent = {
            stealthAddress,
            recipient,
            amount: amount.toString(),
            timestamp: Number(timestamp),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
          
          await this.processWithdrawalEvent(withdrawalEvent);
        } catch (error) {
          console.error('Error processing withdrawal event:', error);
        }
      });
    }
  }

  /**
   * Start polling for missed events
   */
  startPolling() {
    this.pollTimer = setInterval(async () => {
      try {
        await this.pollForMissedEvents();
      } catch (error) {
        console.error('Error during event polling:', error);
      }
    }, this.pollInterval);
  }

  /**
   * Poll for events that might have been missed
   */
  async pollForMissedEvents() {
    try {
      const currentBlock = await qieBlockchainService.provider.getBlockNumber();
      const fromBlock = this.lastProcessedBlock + 1;
      
      if (fromBlock > currentBlock) {
        return; // No new blocks
      }

      // Process in batches to avoid overwhelming the system
      const toBlock = Math.min(fromBlock + this.batchSize - 1, currentBlock);

      // Get payment events
      const paymentEvents = await qieBlockchainService.getPaymentEvents(fromBlock, toBlock);
      
      for (const event of paymentEvents) {
        await this.processPaymentEvent(event);
      }

      // Get meta address events
      if (qieBlockchainService.registryContract) {
        const metaAddressFilter = qieBlockchainService.registryContract.filters.MetaAddressRegistered();
        const metaAddressEvents = await qieBlockchainService.registryContract.queryFilter(metaAddressFilter, fromBlock, toBlock);
        
        for (const event of metaAddressEvents) {
          const metaAddressEvent = {
            user: event.args.user,
            index: Number(event.args.index),
            spendPubKey: event.args.spendPubKey,
            viewingPubKey: event.args.viewingPubKey,
            timestamp: Number(event.args.timestamp),
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
          
          await this.processMetaAddressEvent(metaAddressEvent);
        }
      }

      // Update last processed block
      this.lastProcessedBlock = toBlock;
      await this.saveLastProcessedBlock();

    } catch (error) {
      console.error('Error polling for missed events:', error);
    }
  }

  /**
   * Process a payment announcement event
   */
  async processPaymentEvent(paymentEvent) {
    try {
      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('qie_payment_events')
        .select('id')
        .eq('transaction_hash', paymentEvent.transactionHash)
        .eq('recipient', paymentEvent.recipient)
        .eq('stealth_address', paymentEvent.stealthAddress)
        .single();

      if (existingEvent) {
        return; // Event already processed
      }

      // Insert payment event
      const { error } = await supabase
        .from('qie_payment_events')
        .insert({
          recipient: paymentEvent.recipient,
          meta_address_index: paymentEvent.metaAddressIndex,
          ephemeral_pub_key: paymentEvent.ephemeralPubKey,
          stealth_address: paymentEvent.stealthAddress,
          view_hint: paymentEvent.viewHint,
          k: paymentEvent.k,
          amount: paymentEvent.amount,
          timestamp: new Date(paymentEvent.timestamp * 1000).toISOString(),
          transaction_hash: paymentEvent.transactionHash,
          block_number: paymentEvent.blockNumber,
          processed_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log(`Processed payment event: ${paymentEvent.transactionHash}`);
    } catch (error) {
      console.error('Error processing payment event:', error);
      throw error;
    }
  }

  /**
   * Process a meta address registration event
   */
  async processMetaAddressEvent(metaAddressEvent) {
    try {
      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('qie_meta_address_events')
        .select('id')
        .eq('transaction_hash', metaAddressEvent.transactionHash)
        .eq('user_address', metaAddressEvent.user)
        .eq('meta_address_index', metaAddressEvent.index)
        .single();

      if (existingEvent) {
        return; // Event already processed
      }

      // Insert meta address event
      const { error } = await supabase
        .from('qie_meta_address_events')
        .insert({
          user_address: metaAddressEvent.user,
          meta_address_index: metaAddressEvent.index,
          spend_pub_key: metaAddressEvent.spendPubKey,
          viewing_pub_key: metaAddressEvent.viewingPubKey,
          timestamp: new Date(metaAddressEvent.timestamp * 1000).toISOString(),
          transaction_hash: metaAddressEvent.transactionHash,
          block_number: metaAddressEvent.blockNumber,
          processed_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log(`Processed meta address event: ${metaAddressEvent.transactionHash}`);
    } catch (error) {
      console.error('Error processing meta address event:', error);
      throw error;
    }
  }

  /**
   * Process a stealth withdrawal event
   */
  async processWithdrawalEvent(withdrawalEvent) {
    try {
      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('qie_withdrawal_events')
        .select('id')
        .eq('transaction_hash', withdrawalEvent.transactionHash)
        .eq('stealth_address', withdrawalEvent.stealthAddress)
        .single();

      if (existingEvent) {
        return; // Event already processed
      }

      // Insert withdrawal event
      const { error } = await supabase
        .from('qie_withdrawal_events')
        .insert({
          stealth_address: withdrawalEvent.stealthAddress,
          recipient: withdrawalEvent.recipient,
          amount: withdrawalEvent.amount,
          timestamp: new Date(withdrawalEvent.timestamp * 1000).toISOString(),
          transaction_hash: withdrawalEvent.transactionHash,
          block_number: withdrawalEvent.blockNumber,
          processed_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log(`Processed withdrawal event: ${withdrawalEvent.transactionHash}`);
    } catch (error) {
      console.error('Error processing withdrawal event:', error);
      throw error;
    }
  }

  /**
   * Load last processed block from database
   */
  async loadLastProcessedBlock() {
    try {
      const { data, error } = await supabase
        .from('qie_monitor_state')
        .select('last_processed_block')
        .eq('monitor_name', 'payment_events')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      this.lastProcessedBlock = data?.last_processed_block || 0;
    } catch (error) {
      console.error('Error loading last processed block:', error);
      this.lastProcessedBlock = 0;
    }
  }

  /**
   * Save last processed block to database
   */
  async saveLastProcessedBlock() {
    try {
      const { error } = await supabase
        .from('qie_monitor_state')
        .upsert({
          monitor_name: 'payment_events',
          last_processed_block: this.lastProcessedBlock,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving last processed block:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastProcessedBlock: this.lastProcessedBlock,
      activeListeners: this.eventListeners.size
    };
  }

  /**
   * Get recent events from database
   */
  async getRecentEvents(limit = 50) {
    try {
      const { data: paymentEvents, error: paymentError } = await supabase
        .from('qie_payment_events')
        .select('*')
        .order('block_number', { ascending: false })
        .limit(limit);

      if (paymentError) {
        throw paymentError;
      }

      const { data: metaAddressEvents, error: metaError } = await supabase
        .from('qie_meta_address_events')
        .select('*')
        .order('block_number', { ascending: false })
        .limit(limit);

      if (metaError) {
        throw metaError;
      }

      return {
        paymentEvents: paymentEvents || [],
        metaAddressEvents: metaAddressEvents || []
      };
    } catch (error) {
      console.error('Error getting recent events:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const qieEventMonitor = new QIEEventMonitor();
export default QIEEventMonitor;