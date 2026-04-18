import { describe, it, expect } from 'bun:test';
import { authorize } from './services/auth';
import type { AuthUser } from './services/auth';

describe('Security Basics', () => {
  it('SEC-01 unauthorized user is blocked', () => {
    const r = authorize({ user: null, action: 'view_shipment' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('unauthenticated');
  });

  it('SEC-01b modifying request ID for another user is blocked', () => {
    const user: AuthUser = { id: 'u1', roles: ['sender'], kycStatus: 'approved' };
    const r = authorize({
      user,
      action: 'view_shipment',
      shipmentId: 'shipA',
      requestedShipmentId: 'shipB',
      resourceOwnerIds: ['u2'],
    });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('resource_forbidden');
  });

  it('SEC-02 non-KYC user cannot perform traveler actions', () => {
    const user: AuthUser = { id: 'u1', roles: ['traveler'], kycStatus: 'pending' };
    const r = authorize({ user, action: 'accept_job' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('kyc_required');
  });

  it('SEC-02b role escalation: sender cannot act as traveler', () => {
    const user: AuthUser = { id: 'u1', roles: ['sender'], kycStatus: 'approved' };
    const r = authorize({ user, action: 'pickup_parcel' });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('role_forbidden');
  });

  it('admin refund is admin-only', () => {
    const sender: AuthUser = { id: 'u1', roles: ['sender'], kycStatus: 'approved' };
    const admin: AuthUser = { id: 'a1', roles: ['admin'], kycStatus: 'approved' };
    expect(authorize({ user: sender, action: 'admin_refund' }).allowed).toBe(false);
    expect(authorize({ user: admin, action: 'admin_refund' }).allowed).toBe(true);
  });

  it('admin can access any resource', () => {
    const admin: AuthUser = { id: 'a1', roles: ['admin'], kycStatus: 'approved' };
    const r = authorize({
      user: admin,
      action: 'view_shipment',
      resourceOwnerIds: ['other'],
    });
    expect(r.allowed).toBe(true);
  });
});
