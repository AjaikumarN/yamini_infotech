/**
 * Common UI Components
 * 
 * Enterprise-grade reusable components for consistent UI
 * 
 * @example
 * import { StatusBadge, LoadingState, EmptyState, ErrorState } from '../components/common';
 * 
 * // Status badges automatically detect status type
 * <StatusBadge status="PAID" />
 * <StatusBadge status="pending" />
 * 
 * // Loading states
 * <LoadingState message="Fetching data..." />
 * 
 * // Empty states with actions
 * <EmptyState title="No Results" action={<button>Add New</button>} />
 * 
 * // Error states with retry
 * <ErrorState message="Failed to load" onRetry={refetch} />
 */

export { default as StatusBadge, SuccessBadge, WarningBadge, DangerBadge, InfoBadge } from './StatusBadge';
export { default as LoadingState } from './LoadingState';
export { default as EmptyState, NoSearchResults, NoDataYet, NetworkError } from './EmptyState';
export { default as ErrorState, InlineError, ErrorToast } from './ErrorState';
