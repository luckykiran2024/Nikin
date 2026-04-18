export const LEGAL_VERSION = '1.0.0';
export const LEGAL_EFFECTIVE_DATE = 'April 2026';
export const COMPANY_NAME = 'ParcelPeer';
export const SUPPORT_EMAIL = 'support@parcelpeer.app';
export const GRIEVANCE_EMAIL = 'grievance@parcelpeer.app';
export const GOVERNING_LAW_CITY = 'Bengaluru, Karnataka, India';

export type LegalDocId =
  | 'terms'
  | 'privacy'
  | 'prohibited'
  | 'liability'
  | 'refund'
  | 'safety'
  | 'community';

export interface LegalDoc {
  id: LegalDocId;
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
}

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · v${LEGAL_VERSION}`,
    sections: [
      {
        heading: '1. About this Agreement',
        body: `${COMPANY_NAME} ("we", "us", "the Platform") operates a peer-to-peer parcel delivery marketplace that connects senders with verified travelers. By creating an account or using the app you agree to these Terms.`,
      },
      {
        heading: '2. Role of the Platform',
        body: `${COMPANY_NAME} is a technology intermediary under the Information Technology Act, 2000. We do NOT own, handle, inspect, transport or take custody of parcels. All deliveries are carried out directly between the Sender and the Traveler.`,
      },
      {
        heading: '3. Eligibility',
        body: 'You must be at least 18 years old, legally capable of entering contracts, and provide accurate phone, identity and KYC information. Travelers must complete Aadhaar-based KYC before accepting any parcel.',
      },
      {
        heading: '4. Your Account',
        body: 'You are responsible for all activity on your account, for keeping login credentials secure, and for accurately declaring parcel contents. Misuse may result in suspension or permanent blocking.',
      },
      {
        heading: '5. Pricing and Payments',
        body: 'Travelers quote a price per shipment. A payment intent is created at assignment to confirm sender commitment, and funds are captured after successful delivery confirmation (OTP). A platform fee may apply.',
      },
      {
        heading: '6. Cancellation',
        body: `• Before a traveler is assigned: free cancellation.\n• After assignment but before pickup: cancellation may incur a small fee.\n• After pickup: cancellation is not permitted — only a dispute can be raised.`,
      },
      {
        heading: '7. Disputes',
        body: 'Disputes must be raised from within the app using the "Raise Dispute" button, within 72 hours of delivery. Our support team will review evidence and may hold, refund or release payments at its discretion.',
      },
      {
        heading: '8. Prohibited Items',
        body: 'Sending prohibited, illegal or restricted items is strictly forbidden. See the Prohibited Items page for the full list. Violations may be reported to law enforcement.',
      },
      {
        heading: '9. Limitation of Liability',
        body: `${COMPANY_NAME}'s aggregate liability is limited to the platform fee collected for the specific shipment. We are not liable for loss, damage, delay, or mis-delivery caused by a Sender or Traveler.`,
      },
      {
        heading: '10. Termination',
        body: 'We may suspend or terminate accounts that violate these Terms, applicable law, or community safety standards, with or without notice.',
      },
      {
        heading: '11. Governing Law',
        body: `These Terms are governed by the laws of India. Courts in ${GOVERNING_LAW_CITY} shall have exclusive jurisdiction.`,
      },
      {
        heading: '12. Contact',
        body: `Questions? Email ${SUPPORT_EMAIL}. Grievance Officer: ${GRIEVANCE_EMAIL}.`,
      },
    ],
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · v${LEGAL_VERSION}`,
    sections: [
      {
        heading: '1. Data We Collect',
        body: '• Profile: name, phone, email, gender\n• KYC: Aadhaar number (masked), document images, selfie\n• Shipment: parcel description, addresses, receiver details\n• Device: app version, OS, diagnostic logs\n• Location: live GPS only while you are actively delivering a parcel',
      },
      {
        heading: '2. How We Use Data',
        body: 'To match senders with travelers, verify identity, provide live tracking, process payments, prevent fraud, and comply with legal obligations under Indian law (DPDP Act 2023, IT Act 2000).',
      },
      {
        heading: '3. Location Tracking',
        body: 'Traveler GPS is recorded only between pickup and delivery confirmation. Tracking is visible only to the assigned sender and the traveler. You can end a delivery to stop tracking.',
      },
      {
        heading: '4. KYC Data',
        body: 'Aadhaar images are stored encrypted. Only the last 4 digits of the Aadhaar number are visible in the app. We never share your full Aadhaar with other users.',
      },
      {
        heading: '5. Sharing',
        body: 'We share limited data with: (i) the other party of a shipment (name, masked phone, rating); (ii) payment gateway (Razorpay); (iii) cloud infrastructure (Supabase / AWS India region); (iv) law enforcement if compelled by valid legal process.',
      },
      {
        heading: '6. Your Rights',
        body: 'Under the DPDP Act you have the right to access, correct, erase your data and withdraw consent. Email ' + SUPPORT_EMAIL + ' to exercise these rights.',
      },
      {
        heading: '7. Retention',
        body: 'Shipment, KYC and financial records are retained for up to 7 years to meet tax and compliance requirements. Chats are retained for 1 year.',
      },
      {
        heading: '8. Security',
        body: 'Data in transit is protected with TLS 1.2+. Sensitive documents are encrypted at rest. Access is role-based and audited.',
      },
      {
        heading: '9. Children',
        body: 'The app is not intended for users under 18.',
      },
      {
        heading: '10. Contact',
        body: `Data Protection Officer: ${GRIEVANCE_EMAIL}.`,
      },
    ],
  },
  prohibited: {
    id: 'prohibited',
    title: 'Prohibited & Restricted Items',
    subtitle: 'Read this before creating a shipment',
    sections: [
      {
        heading: 'Absolutely Prohibited',
        body: '• Narcotics, psychotropic or controlled substances\n• Firearms, ammunition, explosives, fireworks\n• Human or animal remains, organs, body fluids\n• Currency notes, bullion, gold bars, unmounted gemstones\n• Live animals, plants requiring phytosanitary permits\n• Counterfeit goods, pirated media\n• Hazardous chemicals, corrosives, radioactive material\n• Obscene or child-exploitation material',
      },
      {
        heading: 'Restricted (not supported in pilot)',
        body: '• Alcohol, tobacco, vapes\n• Prescription medicines without a valid prescription\n• Lithium batteries > 100 Wh (airline rules)\n• Perishables requiring cold chain\n• High-value jewellery (> ₹20,000)\n• Items requiring insurance or customs clearance',
      },
      {
        heading: 'Your Declaration',
        body: 'Every shipment requires an on-app declaration confirming the parcel contains none of the above. False declaration is grounds for immediate suspension and may be reported to authorities.',
      },
      {
        heading: 'Traveler Right to Refuse',
        body: 'Travelers may refuse any parcel that appears suspicious, undeclared, or tampered with. Please keep parcels open for inspection at pickup.',
      },
    ],
  },
  liability: {
    id: 'liability',
    title: 'Liability & Insurance',
    subtitle: 'What is covered and what is not',
    sections: [
      {
        heading: 'Platform Role',
        body: `${COMPANY_NAME} is a technology marketplace. We do not transport parcels and we are not a common carrier under the Carriage by Road Act, 2007.`,
      },
      {
        heading: 'Parcel Value Cap (Pilot)',
        body: 'During the pilot, declared parcel value is capped at ₹20,000. Higher-value parcels are not supported.',
      },
      {
        heading: 'Loss or Damage',
        body: 'Direct liability for loss or damage rests with the individual Traveler handling the parcel. You may recover damages through the in-app dispute process or through civil courts.',
      },
      {
        heading: 'Platform Cap',
        body: 'If the platform is found liable for any reason whatsoever, total liability is limited to the platform fee collected for that shipment.',
      },
      {
        heading: 'Insurance',
        body: 'Third-party parcel insurance is not offered in the pilot. You are free to arrange your own coverage for valuable items.',
      },
      {
        heading: 'Force Majeure',
        body: 'Neither party is liable for delays caused by events beyond reasonable control — natural disasters, curfews, strikes, transit cancellations, or government action.',
      },
    ],
  },
  refund: {
    id: 'refund',
    title: 'Refund & Cancellation',
    subtitle: 'Clear rules, no surprises',
    sections: [
      {
        heading: 'Before Assignment',
        body: 'Cancel any time, free of charge. No traveler has committed yet.',
      },
      {
        heading: 'After Assignment, Before Pickup',
        body: 'Sender cancellation: ₹30 convenience fee may apply to compensate the assigned traveler.\nTraveler cancellation: no charge, but repeated cancellations affect trust score.',
      },
      {
        heading: 'After Pickup',
        body: 'Cancellation is not permitted. Raise a dispute instead — our team will mediate.',
      },
      {
        heading: 'Failed Delivery',
        body: 'If the receiver is unavailable, the traveler can reschedule (up to 2 attempts) or initiate a return-to-sender. Return fee, if any, is shown at the time of request.',
      },
      {
        heading: 'Refund Timelines',
        body: 'Approved refunds are processed to the original payment method within 5–7 business days.',
      },
      {
        heading: 'Disputed Refunds',
        body: 'If a dispute is open, the payment is held until resolution. You will be notified at every stage.',
      },
    ],
  },
  safety: {
    id: 'safety',
    title: 'Safety & Trust',
    subtitle: 'How we keep the community safe',
    sections: [
      {
        heading: 'Verified Travelers Only',
        body: 'Every traveler completes Aadhaar KYC with selfie match before accepting any parcel.',
      },
      {
        heading: 'Live Tracking',
        body: 'GPS is recorded from pickup to delivery and visible to both parties in real time.',
      },
      {
        heading: 'OTP at Pickup and Delivery',
        body: 'A 4-digit OTP is shared with the sender at pickup and with the receiver at delivery. No OTP, no handover.',
      },
      {
        heading: 'Two-sided Ratings',
        body: 'After every completed delivery, both parties rate each other. Low ratings reduce visibility.',
      },
      {
        heading: 'Report Suspicious Activity',
        body: 'If anything feels off — wrong parcel, pressure to skip OTP, off-route traveler — tap "Raise Dispute" or contact support immediately.',
      },
      {
        heading: 'Trust Limits',
        body: 'New senders have limits on active shipments and declared value until their trust score grows.',
      },
    ],
  },
  community: {
    id: 'community',
    title: 'Community Guidelines',
    subtitle: 'Be decent. Be honest. Be on time.',
    sections: [
      {
        heading: 'Respect',
        body: 'No harassment, slurs, or discriminatory behavior in chat, calls, or in person.',
      },
      {
        heading: 'Honesty',
        body: 'Declare parcels accurately. Never ask a traveler to carry undeclared items.',
      },
      {
        heading: 'Reliability',
        body: 'Show up on time for pickup and delivery. If plans change, update the other party immediately.',
      },
      {
        heading: 'Privacy',
        body: 'Do not share the other party\u2019s phone number or address outside the app.',
      },
      {
        heading: 'Consequences',
        body: 'Violations can lead to warnings, trust-score reductions, suspension, or permanent ban.',
      },
    ],
  },
};
