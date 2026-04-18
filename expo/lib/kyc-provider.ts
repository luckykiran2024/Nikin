const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaarChecksum(aadhaar: string): boolean {
  const cleaned = aadhaar.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) return false;
  const digits = cleaned.split('').reverse().map((d) => parseInt(d, 10));
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

export function isValidPassport(passport: string): boolean {
  return /^[A-PR-WY][1-9]\d\s?\d{4}[1-9]$/.test(passport.toUpperCase());
}

export function isValidDrivingLicense(dl: string): boolean {
  const cleaned = dl.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-Z]{2}\d{2}\s?\d{11}$/.test(cleaned) || cleaned.length >= 10;
}

export type KYCVerificationResult = {
  success: boolean;
  provider: string;
  referenceId: string;
  verifiedFields: {
    aadhaar: boolean;
    pan: boolean;
    passport?: boolean;
    drivingLicense?: boolean;
    selfieMatch: boolean;
  };
  confidenceScore: number;
  message: string;
  rawResponse?: Record<string, unknown>;
};

export type KYCVerificationInput = {
  aadhaarNumber: string;
  panNumber: string;
  passportNumber?: string;
  drivingLicenseNumber?: string;
  selfieUploaded: boolean;
  otpVerified?: boolean;
};

export type KYCOTPResponse = {
  success: boolean;
  referenceId: string;
  otp?: string;
  message: string;
  expiresInSeconds: number;
};

function generateRefId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendAadhaarOTP(aadhaarNumber: string): Promise<KYCOTPResponse> {
  await delay(800);
  const cleaned = aadhaarNumber.replace(/\s/g, '');
  console.log('[KYC][mock] sendAadhaarOTP', cleaned.slice(-4));

  if (!isValidAadhaarChecksum(cleaned)) {
    return {
      success: false,
      referenceId: '',
      message: 'Invalid Aadhaar number (checksum failed)',
      expiresInSeconds: 0,
    };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    success: true,
    referenceId: generateRefId('OTP'),
    otp,
    message: `OTP sent to registered mobile. (DEV: ${otp})`,
    expiresInSeconds: 120,
  };
}

export async function verifyAadhaarOTP(
  referenceId: string,
  otp: string,
  expectedOtp: string
): Promise<{ success: boolean; message: string }> {
  await delay(500);
  console.log('[KYC][mock] verifyAadhaarOTP', referenceId);
  if (!/^\d{6}$/.test(otp)) {
    return { success: false, message: 'OTP must be 6 digits' };
  }
  if (otp !== expectedOtp) {
    return { success: false, message: 'Incorrect OTP' };
  }
  return { success: true, message: 'OTP verified' };
}

export async function verifyKYC(input: KYCVerificationInput): Promise<KYCVerificationResult> {
  await delay(1500);
  console.log('[KYC][mock] verifyKYC start');

  const aadhaarOk = isValidAadhaarChecksum(input.aadhaarNumber);
  const panOk = isValidPAN(input.panNumber);
  const passportOk = input.passportNumber ? isValidPassport(input.passportNumber) : undefined;
  const dlOk = input.drivingLicenseNumber ? isValidDrivingLicense(input.drivingLicenseNumber) : undefined;
  const selfieMatch = input.selfieUploaded && Math.random() > 0.02;

  const required = aadhaarOk && panOk && selfieMatch && (input.otpVerified ?? true);
  const optionalValid = (passportOk ?? true) && (dlOk ?? true);

  const score =
    (aadhaarOk ? 35 : 0) +
    (panOk ? 30 : 0) +
    (selfieMatch ? 25 : 0) +
    (input.otpVerified ? 10 : 0);

  const result: KYCVerificationResult = {
    success: required && optionalValid,
    provider: 'mock',
    referenceId: generateRefId('KYC'),
    verifiedFields: {
      aadhaar: aadhaarOk,
      pan: panOk,
      passport: passportOk,
      drivingLicense: dlOk,
      selfieMatch,
    },
    confidenceScore: score,
    message:
      required && optionalValid
        ? 'KYC verified successfully'
        : !aadhaarOk
          ? 'Aadhaar verification failed'
          : !panOk
            ? 'PAN verification failed'
            : !selfieMatch
              ? 'Selfie does not match document photo'
              : 'Verification failed',
  };

  console.log('[KYC][mock] verifyKYC result', result);
  return result;
}

export const KYC_PROVIDER = {
  name: 'mock',
  isValidAadhaarChecksum,
  isValidPAN,
  isValidPassport,
  isValidDrivingLicense,
  sendAadhaarOTP,
  verifyAadhaarOTP,
  verifyKYC,
} as const;
