import type { KYCStatus, UserRole } from '@/types';

export interface AuthUser {
  id: string;
  roles: UserRole[];
  kycStatus: KYCStatus;
}

export interface AuthzRequest {
  user: AuthUser | null;
  action:
    | 'submit_quote'
    | 'accept_job'
    | 'pickup_parcel'
    | 'deliver_parcel'
    | 'raise_dispute'
    | 'admin_refund'
    | 'view_shipment';
  resourceOwnerIds?: string[];
  shipmentId?: string;
  requestedShipmentId?: string;
}

export interface AuthzResult {
  allowed: boolean;
  reason?:
    | 'unauthenticated'
    | 'kyc_required'
    | 'role_forbidden'
    | 'resource_forbidden'
    | 'admin_only';
}

const TRAVELER_ACTIONS = new Set([
  'submit_quote',
  'accept_job',
  'pickup_parcel',
  'deliver_parcel',
]);

export function authorize(req: AuthzRequest): AuthzResult {
  if (!req.user) return { allowed: false, reason: 'unauthenticated' };
  const { user, action } = req;

  if (action === 'admin_refund') {
    return user.roles.includes('admin')
      ? { allowed: true }
      : { allowed: false, reason: 'admin_only' };
  }

  if (TRAVELER_ACTIONS.has(action)) {
    if (!user.roles.includes('traveler')) {
      return { allowed: false, reason: 'role_forbidden' };
    }
    if (user.kycStatus !== 'approved') {
      return { allowed: false, reason: 'kyc_required' };
    }
  }

  if (action === 'raise_dispute' && !user.roles.some((r) => r === 'sender' || r === 'receiver' || r === 'traveler')) {
    return { allowed: false, reason: 'role_forbidden' };
  }

  if (
    req.requestedShipmentId &&
    req.shipmentId &&
    req.requestedShipmentId !== req.shipmentId &&
    !user.roles.includes('admin')
  ) {
    return { allowed: false, reason: 'resource_forbidden' };
  }

  if (req.resourceOwnerIds && !user.roles.includes('admin')) {
    if (!req.resourceOwnerIds.includes(user.id)) {
      return { allowed: false, reason: 'resource_forbidden' };
    }
  }

  return { allowed: true };
}
