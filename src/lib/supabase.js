import { createClient } from '@supabase/supabase-js';
import { markLegacyTransactions } from './qie/qieTransactionService.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

// Validate that URL doesn't look like an error message
if (supabaseUrl && (supabaseUrl.includes('<') || supabaseUrl.includes('Per anonym'))) {
  console.error('❌ Supabase URL appears to be corrupted HTML:', supabaseUrl.substring(0, 100));
  throw new Error('Supabase URL is corrupted. Please check environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  auth: { persistSession: false },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

// Helper function to validate Supabase responses
const validateSupabaseResponse = (data, error, operation) => {
  // Check if data is HTML instead of JSON
  if (data && typeof data === 'string') {
    const trimmedData = data.trim();
    if (trimmedData.startsWith('<') || trimmedData.includes('<!DOCTYPE') || trimmedData.includes('Per anonym')) {
      console.error(`❌ Supabase ${operation} returned HTML:`, data.substring(0, 100));
      throw new Error(`Supabase ${operation} failed: Server returned HTML instead of JSON. Database may be unreachable.`);
    }
  }
  
  // Check if error contains HTML
  if (error && error.message && typeof error.message === 'string') {
    if (error.message.includes('<') || error.message.includes('Per anonym') || error.message.includes('<!DOCTYPE')) {
      console.error(`❌ Supabase ${operation} error contains HTML:`, error.message.substring(0, 100));
      throw new Error(`Supabase ${operation} failed: Server returned HTML error page. Database may be unreachable.`);
    }
  }
  
  return { data, error };
};

// Database Tables:
// 1. users: id, wallet_address, username, created_at
// 2. payments: id, sender_address, recipient_username, amount, tx_hash, status, created_at
// 3. balances: id, username, wallet_address, available_balance, created_at, updated_at
// 4. payment_links: id, wallet_address, username, alias, created_at

/**
 * Register or get user
 */
export async function registerUser(walletAddress, username) {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingUser) {
      // Update username if changed
      if (existingUser.username !== username) {
        const { data, error } = await supabase
          .from('users')
          .update({ username })
          .eq('wallet_address', walletAddress)
          .select()
          .single();

        if (error) throw error;
        
        // Ensure balance record exists for updated username
        await ensureBalanceRecord(username, walletAddress);
        
        return data;
      }
      
      // Ensure balance record exists
      await ensureBalanceRecord(username, walletAddress);
      
      return existingUser;
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert([{ wallet_address: walletAddress, username }])
      .select()
      .single();

    if (error) throw error;

    // Initialize balance
    await ensureBalanceRecord(username, walletAddress);

    return data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Ensure balance record exists for a user
 */
async function ensureBalanceRecord(username, walletAddress) {
  try {
    // Check if balance record exists
    const { data: existingBalance } = await supabase
      .from('balances')
      .select('*')
      .eq('username', username)
      .single();

    if (!existingBalance) {
      // Create balance record
      await supabase
        .from('balances')
        .insert([{ 
          username, 
          wallet_address: walletAddress, 
          available_balance: 0 
        }]);
    }
  } catch (error) {
    console.error('Error ensuring balance record:', error);
    // Don't throw here, it's not critical
  }
}

/**
 * Record incoming payment
 * Optionally attach the payment_alias (the payment link alias that was used)
 * so we can compute per-link totals on the dashboard.
 */
export async function recordPayment(senderAddress, recipientUsername, amount, txHash, paymentAlias = null) {
  try {
    // First, verify that the recipient user exists
    const { data: recipientUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', recipientUsername)
      .single();

    if (userError || !recipientUser) {
      throw new Error(`Recipient username '${recipientUsername}' not found`);
    }

    // Base payload for payments table
    const basePayload = {
      sender_address: senderAddress,
      recipient_username: recipientUsername,
      amount: parseFloat(amount),
      tx_hash: txHash,
      status: 'completed',
      network: 'qie', // Mark as QIE network payment
    };

    // Try inserting with payment_alias if provided. If the column doesn't
    // exist yet on the Supabase instance (migration not applied), gracefully
    // fall back to inserting without it so payments still work.
    let payment, paymentError;
    try {
      const payloadWithAlias =
        paymentAlias != null && paymentAlias !== ""
          ? { ...basePayload, payment_alias: paymentAlias }
          : basePayload;

      ({ data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([payloadWithAlias])
        .select()
        .single());

      // If Supabase returns an undefined-column error referencing payment_alias,
      // trigger the fallback path below.
      if (
        paymentError &&
        (paymentError.code === '42703' ||
          (typeof paymentError.message === 'string' &&
            paymentError.message.includes('payment_alias')))
      ) {
        throw paymentError;
      }
    } catch (insertError) {
      const message = insertError?.message || insertError?.toString() || '';
      const code = insertError?.code;

      if (message.includes('payment_alias') || code === '42703') {
        console.warn(
          "payments.payment_alias column missing; inserting payment without alias. " +
            "Run the latest Supabase migration to enable per-link totals."
        );

        ({ data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert([basePayload])
          .select()
          .single());
      } else {
        throw insertError;
      }
    }

    validateSupabaseResponse(payment, paymentError, 'recordPayment');

    if (paymentError) throw paymentError;

    // Check if balance record exists, create if not
    const { data: balance, error: balanceError } = await supabase
      .from('balances')
      .select('available_balance')
      .eq('username', recipientUsername)
      .single();

    let currentBalance = 0;
    
    if (balanceError && balanceError.code === 'PGRST116') {
      // Balance record doesn't exist, create it
      const { data: newBalance, error: createError } = await supabase
        .from('balances')
        .insert([{
          username: recipientUsername,
          wallet_address: recipientUser.wallet_address || recipientUser.qie_address,
          available_balance: parseFloat(amount)
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating balance record:', createError);
        // Don't throw here, payment is already recorded
      }
    } else if (balanceError) {
      console.error('Error getting balance:', balanceError);
      // Don't throw here, payment is already recorded
    } else {
      // Balance exists, update it
      currentBalance = balance?.available_balance || 0;
      const newBalance = currentBalance + parseFloat(amount);

      const { error: updateError } = await supabase
        .from('balances')
        .update({ 
          available_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('username', recipientUsername);

      if (updateError) {
        console.error('Error updating balance:', updateError);
        // Don't throw here, payment is already recorded
      }
    }

    return payment;
  } catch (error) {
    console.error('Error recording payment:', error);
    // Check if error message contains HTML
    if (error.message && typeof error.message === 'string' && error.message.includes('<')) {
      console.error('Supabase returned HTML error page during payment recording');
      throw new Error('Database is unreachable. Payment may not have been recorded.');
    }
    throw error;
  }
}

/**
 * Get per-alias totals for a recipient username.
 * Returns an array of { payment_alias, total_amount } rows.
 */
export async function getPaymentTotalsByAlias(recipientUsername) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('payment_alias, amount, status, network')
      .eq('recipient_username', recipientUsername);

    if (error) throw error;

    if (!data || data.length === 0) return {};

    const totals = {};

    for (const payment of data) {
      // Only count completed incoming payments that are tied to an alias
      if (
        !payment.payment_alias ||
        payment.status !== 'completed' ||
        payment.network !== 'qie' ||
        typeof payment.amount !== 'number' ||
        payment.amount <= 0
      ) {
        continue;
      }

      const alias = payment.payment_alias;
      if (!totals[alias]) {
        totals[alias] = 0;
      }
      totals[alias] += payment.amount;
    }

    return totals;
  } catch (error) {
    console.error('Error getting payment totals by alias:', error);
    return {};
  }
}

/**
 * Get user balance
 */
export async function getUserBalance(username) {
  try {
    const { data, error } = await supabase
      .from('balances')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting balance:', error);
    return { available_balance: 0 };
  }
}

/**
 * Get user payments (received and sent) with network distinction
 */
export async function getUserPayments(username) {
  try {
    // Get received payments with network information
    const { data: receivedPayments, error: receivedError } = await supabase
      .from('payments')
      .select('*, network')
      .eq('recipient_username', username)
      .order('created_at', { ascending: false });

    if (receivedError) throw receivedError;

    // Get sent payments (where user is the sender)
    // We need to get the user's wallet address first
    const { data: user } = await supabase
      .from('users')
      .select('wallet_address, qie_address')
      .eq('username', username)
      .single();

    let sentPayments = [];
    if (user) {
      // Check for sent payments from both Aptos and QIE addresses
      const senderAddresses = [user.wallet_address, user.qie_address].filter(Boolean);
      
      for (const address of senderAddresses) {
        const { data: sent, error: sentError } = await supabase
          .from('payments')
          .select('*, network')
          .eq('sender_address', address)
          .order('created_at', { ascending: false });

        if (!sentError && sent) {
          // Mark sent payments with a flag and preserve network info
          const markedSent = sent.map(payment => ({
            ...payment,
            is_sent: true
          }));
          sentPayments = [...sentPayments, ...markedSent];
        }
      }
    }

    // Combine and sort by date
    const allPayments = [...(receivedPayments || []), ...sentPayments]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Mark legacy transactions with proper network identification
    const markedPayments = markLegacyTransactions(allPayments);

    return markedPayments;
  } catch (error) {
    console.error('Error getting payments:', error);
    return [];
  }
}

/**
 * Withdraw funds
 */
export async function withdrawFunds(username, amount, destinationAddress, txHash) {
  try {
    // Get current balance
    const { data: balance, error: balanceError } = await supabase
      .from('balances')
      .select('available_balance')
      .eq('username', username)
      .single();

    validateSupabaseResponse(balance, balanceError, 'withdrawFunds.getBalance');

    if (balanceError) throw balanceError;

    if (!balance || balance.available_balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Record withdrawal
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('payments')
      .insert([{
        sender_address: 'treasury',
        recipient_username: username,
        amount: -parseFloat(amount),
        tx_hash: txHash,
        status: 'withdrawn',
        network: 'qie' // Mark as QIE network withdrawal
      }])
      .select()
      .single();

    validateSupabaseResponse(withdrawal, withdrawalError, 'withdrawFunds.recordWithdrawal');

    if (withdrawalError) throw withdrawalError;

    // Update balance
    const newBalance = balance.available_balance - parseFloat(amount);
    const { error: updateError } = await supabase
      .from('balances')
      .update({ 
        available_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('username', username);

    if (updateError) {
      validateSupabaseResponse(null, updateError, 'withdrawFunds.updateBalance');
      throw updateError;
    }

    return { success: true, newBalance };
  } catch (error) {
    console.error('❌ Error withdrawing funds from Supabase:', error);
    
    // Check if error message contains HTML or "Per anonym"
    const errorStr = error?.message || error?.toString() || '';
    if (errorStr.includes('<') || errorStr.includes('Per anonym') || errorStr.includes('<!DOCTYPE')) {
      console.error('🚨 Supabase returned HTML error page during withdrawal');
      throw new Error('Database is unreachable or returned an error page. Your funds were transferred on-chain successfully, but the balance may not be updated in the dashboard.');
    }
    
    // Check for JSON parsing errors
    if (errorStr.includes('Unexpected token') || errorStr.includes('JSON')) {
      console.error('🚨 JSON parsing error - likely received HTML instead of JSON');
      throw new Error('Database returned invalid data. Your transaction succeeded on the blockchain, but balance tracking failed.');
    }
    
    // Check for network/connection errors
    if (errorStr.includes('Failed to fetch') || errorStr.includes('Network')) {
      console.error('🚨 Network connection error');
      throw new Error('Cannot connect to database. Please check your internet connection.');
    }
    
    throw error;
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    // Validate response
    validateSupabaseResponse(data, error, 'getUserByUsername');

    if (error) {
      // Handle "not found" gracefully
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    // Ensure balance record exists for this user
    if (data) {
      await ensureBalanceRecord(data.username, data.wallet_address || data.qie_address);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user:', error);
    // Check if error message contains HTML
    if (error.message && typeof error.message === 'string' && error.message.includes('<')) {
      console.error('Supabase returned HTML error page');
      throw new Error('Database is unreachable. Please check your connection.');
    }
    return null;
  }
}

/**
 * Fix missing balance records for existing users
 */
export async function fixMissingBalanceRecords() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, wallet_address, qie_address');

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      console.log('No users found');
      return;
    }

    let fixed = 0;
    for (const user of users) {
      try {
        // Check if balance record exists
        const { data: balance } = await supabase
          .from('balances')
          .select('*')
          .eq('username', user.username)
          .single();

        if (!balance) {
          // Create missing balance record
          await supabase
            .from('balances')
            .insert([{
              username: user.username,
              wallet_address: user.wallet_address || user.qie_address,
              available_balance: 0
            }]);
          
          fixed++;
          console.log(`Created balance record for user: ${user.username}`);
        }
      } catch (error) {
        console.error(`Error fixing balance for user ${user.username}:`, error);
      }
    }

    console.log(`Fixed ${fixed} missing balance records`);
    return { fixed, total: users.length };
  } catch (error) {
    console.error('Error fixing missing balance records:', error);
    throw error;
  }
}

/**
 * Create payment link
 */
export async function createPaymentLink(walletAddress, username, alias, qieData = null) {
  try {
    const linkData = {
      wallet_address: walletAddress,
      username,
      alias
    };

    // Add QIE-specific data if provided
    if (qieData) {
      linkData.meta_address = qieData.metaAddress;
      linkData.stealth_data = qieData.stealthData;
      linkData.qr_data = qieData.qrData;
      linkData.chain_id = qieData.chainId;
      linkData.network = qieData.network;
    }

    const { data, error } = await supabase
      .from('payment_links')
      .insert([linkData])
      .select()
      .single();

    if (error) {
      // Handle duplicate alias by migrating/updating existing record.
      // This situation commonly happens when an alias was previously created
      // for the Aptos version and we now want to reuse it for QIE.
      if (
        error.code === '23505' || // Postgres unique_violation
        (typeof error.message === 'string' &&
          error.message.toLowerCase().includes('duplicate key'))
      ) {
        console.warn(
          'Payment link alias already exists. Updating existing record for QIE instead of failing.',
          { alias }
        );

        // Fetch the existing payment link for this alias
        const { data: existingLink, error: fetchError } = await supabase
          .from('payment_links')
          .select('*')
          .eq('alias', alias)
          .single();

        if (fetchError || !existingLink) {
          console.error(
            'Failed to fetch existing payment link after duplicate error:',
            fetchError || 'Not found'
          );
          throw error;
        }

        // Merge new data into the existing row, preferring the latest QIE data
        const mergedData = {
          ...existingLink,
          ...linkData,
        };

        const { data: updatedLink, error: updateError } = await supabase
          .from('payment_links')
          .update(mergedData)
          .eq('id', existingLink.id)
          .select()
          .single();

        if (updateError) {
          console.error(
            'Failed to update existing payment link after duplicate error:',
            updateError
          );
          throw updateError;
        }

        return updatedLink;
      }

      // Non-duplicate errors: bubble up
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

/**
 * Get payment links by wallet address
 */
export async function getPaymentLinks(walletAddress) {
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting payment links:', error);
    return [];
  }
}

/**
 * Get payment link by alias
 */
export async function getPaymentLinkByAlias(alias) {
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('alias', alias)
      .single();

    validateSupabaseResponse(data, error, 'getPaymentLinkByAlias');

    if (error) {
      // Handle "not found" gracefully
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting payment link:', error);
    // Check if error message contains HTML
    if (error.message && typeof error.message === 'string' && error.message.includes('<')) {
      console.error('Supabase returned HTML error page');
      throw new Error('Database is unreachable. Please check your connection.');
    }
    return null;
  }
}
