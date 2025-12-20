/**
 * User Migration Dialog Component
 * 
 * Provides UI for migrating user data from Aptos to QIE network
 */

import React, { useState, useEffect } from 'react';
import { 
  needsMigration, 
  hasMigrated, 
  getMigrationProgress, 
  startMigration, 
  validateMigration,
  getMigrationSummary,
  getMigrationRecommendations,
  MIGRATION_STATUS 
} from '../../utils/migration-utils.js';
import QIEOnboardingButton from '../shared/QIEOnboardingButton.jsx';
import { useQIEOnboarding } from '../../hooks/use-qie-onboarding.js';

const UserMigrationDialog = ({ 
  isOpen, 
  onClose, 
  user, 
  qieAddress, 
  onMigrationComplete 
}) => {
  const [migrationState, setMigrationState] = useState({
    status: MIGRATION_STATUS.NOT_STARTED,
    progress: 0,
    isLoading: false,
    error: null,
    summary: null,
    recommendations: []
  });

  const [migrationOptions, setMigrationOptions] = useState({
    preserveMetaAddresses: true,
    updatePaymentLinks: true
  });

  const { needsOnboarding, triggerOnboarding } = useQIEOnboarding();

  useEffect(() => {
    if (isOpen && user?.wallet_address) {
      loadMigrationStatus();
      loadRecommendations();
    }
  }, [isOpen, user]);

  const loadMigrationStatus = async () => {
    try {
      const progress = await getMigrationProgress(user.wallet_address);
      setMigrationState(prev => ({
        ...prev,
        status: progress.status,
        progress: progress.progress || 0,
        summary: progress.isComplete ? getMigrationSummary(progress) : null,
        error: progress.error
      }));
    } catch (error) {
      console.error('Error loading migration status:', error);
      setMigrationState(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  const loadRecommendations = async () => {
    try {
      // This would typically fetch user data including meta addresses and payment links
      const userData = {
        metaAddresses: [], // Would be fetched from API
        paymentLinks: [], // Would be fetched from API
        payments: [] // Would be fetched from API
      };
      
      const recommendations = getMigrationRecommendations(userData);
      setMigrationState(prev => ({
        ...prev,
        recommendations
      }));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleStartMigration = async () => {
    if (!qieAddress) {
      setMigrationState(prev => ({
        ...prev,
        error: 'QIE wallet address is required'
      }));
      return;
    }

    setMigrationState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const result = await startMigration(
        user.wallet_address, 
        qieAddress, 
        migrationOptions
      );

      if (result.success) {
        setMigrationState(prev => ({
          ...prev,
          status: MIGRATION_STATUS.COMPLETED,
          progress: 100,
          summary: getMigrationSummary(result.result),
          isLoading: false
        }));

        if (onMigrationComplete) {
          onMigrationComplete(result.result);
        }
      } else {
        setMigrationState(prev => ({
          ...prev,
          error: result.error,
          isLoading: false
        }));
      }
    } catch (error) {
      setMigrationState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  };

  const handleValidateMigration = async () => {
    setMigrationState(prev => ({
      ...prev,
      isLoading: true
    }));

    try {
      const validation = await validateMigration(user.wallet_address);
      
      setMigrationState(prev => ({
        ...prev,
        isLoading: false,
        error: validation.isValid ? null : 'Migration validation failed'
      }));

      if (validation.isValid) {
        alert('Migration validation passed successfully!');
      } else {
        alert(`Migration validation failed: ${validation.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMigrationState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  };

  if (!isOpen) return null;

  const { status, progress, isLoading, error, summary, recommendations } = migrationState;
  const showMigrationNeeded = needsMigration(user);
  const showMigrationComplete = hasMigrated(user) || status === MIGRATION_STATUS.COMPLETED;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Migrate to QIE Network
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {showMigrationComplete ? (
          <MigrationCompleteView 
            user={user}
            summary={summary}
            onValidate={handleValidateMigration}
            isLoading={isLoading}
          />
        ) : showMigrationNeeded ? (
          <MigrationNeededView
            user={user}
            qieAddress={qieAddress}
            recommendations={recommendations}
            migrationOptions={migrationOptions}
            onOptionsChange={setMigrationOptions}
            onStartMigration={handleStartMigration}
            isLoading={isLoading}
            progress={progress}
            status={status}
            needsOnboarding={needsOnboarding}
            triggerOnboarding={triggerOnboarding}
          />
        ) : (
          <NoMigrationNeededView user={user} />
        )}
      </div>
    </div>
  );
};

const MigrationNeededView = ({ 
  user, 
  qieAddress, 
  recommendations, 
  migrationOptions, 
  onOptionsChange, 
  onStartMigration, 
  isLoading, 
  progress, 
  status,
  needsOnboarding,
  triggerOnboarding
}) => (
  <div>
    <div className="mb-4">
      <p className="text-gray-600 mb-2">
        Your account is currently on Aptos network. Migrate to QIE to continue using PrivatePay.
      </p>
      
      {needsOnboarding && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-1">QIE Setup Required</h4>
              <p className="text-sm text-yellow-800 mb-2">
                You need to set up your QIE wallet before migrating. This includes connecting MetaMask and switching to QIE network.
              </p>
              <QIEOnboardingButton 
                variant="warning" 
                size="small"
                showProgress={true}
              >
                Complete QIE Setup First
              </QIEOnboardingButton>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <h3 className="font-semibold text-blue-900 mb-2">What will be migrated:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="mb-4">
      <h3 className="font-semibold mb-2">Migration Options:</h3>
      
      <label className="flex items-center mb-2">
        <input
          type="checkbox"
          checked={migrationOptions.preserveMetaAddresses}
          onChange={(e) => onOptionsChange(prev => ({
            ...prev,
            preserveMetaAddresses: e.target.checked
          }))}
          className="mr-2"
        />
        <span className="text-sm">Preserve meta addresses (recommended)</span>
      </label>
      
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={migrationOptions.updatePaymentLinks}
          onChange={(e) => onOptionsChange(prev => ({
            ...prev,
            updatePaymentLinks: e.target.checked
          }))}
          className="mr-2"
        />
        <span className="text-sm">Update payment links (recommended)</span>
      </label>
    </div>

    {status === MIGRATION_STATUS.IN_PROGRESS && (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Migration Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )}

    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Current Aptos Address:
      </label>
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
        {user.wallet_address}
      </div>
    </div>

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        QIE Address:
      </label>
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded font-mono">
        {qieAddress || 'Connect QIE wallet first'}
      </div>
    </div>

    <button
      onClick={onStartMigration}
      disabled={isLoading || !qieAddress || status === MIGRATION_STATUS.IN_PROGRESS || needsOnboarding}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Migrating...' : needsOnboarding ? 'Complete QIE Setup First' : 'Start Migration'}
    </button>
  </div>
);

const MigrationCompleteView = ({ user, summary, onValidate, isLoading }) => (
  <div>
    <div className="text-center mb-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-green-900">Migration Complete!</h3>
      <p className="text-green-700">Your account has been successfully migrated to QIE network.</p>
    </div>

    {summary && (
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Migration Summary:</h4>
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <div className="flex justify-between mb-1">
            <span>Status:</span>
            <span className="font-medium text-green-600">{summary.statusMessage}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Started:</span>
            <span>{summary.startedAt}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span>Completed:</span>
            <span>{summary.completedAt}</span>
          </div>
          
          {summary.steps.length > 0 && (
            <div>
              <span className="font-medium">Migration Steps:</span>
              <ul className="mt-1 space-y-1">
                {summary.steps.map((step, index) => (
                  <li key={index} className="flex items-center text-xs">
                    <span className={`mr-2 ${step.success ? 'text-green-600' : 'text-red-600'}`}>
                      {step.success ? '✓' : '✗'}
                    </span>
                    {step.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )}

    <div className="mb-4">
      <div className="bg-blue-50 p-3 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-1">What's Next:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your payment links now work on QIE network</li>
          <li>• Historical Aptos data remains accessible</li>
          <li>• You can start receiving QIE payments immediately</li>
        </ul>
      </div>
    </div>

    <button
      onClick={onValidate}
      disabled={isLoading}
      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 mb-2"
    >
      {isLoading ? 'Validating...' : 'Validate Migration'}
    </button>
  </div>
);

const NoMigrationNeededView = ({ user }) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Migration Needed</h3>
    <p className="text-gray-600">
      Your account is already set up for QIE network or doesn't require migration.
    </p>
  </div>
);

export default UserMigrationDialog;