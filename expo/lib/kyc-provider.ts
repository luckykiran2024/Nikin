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

export function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
}

export function isValidBankAccount(acc: string): boolean {
  const cleaned = acc.replace(/\s/g, '');
  return /^\d{9,18}$/.test(cleaned);
}

export async function verifyBankAccount(
  accountNumber: string,
  ifsc: string,
  accountHolder: string
): Promise<{ success: boolean; message: string; referenceId: string; bankName?: string }> {
  await delay(1200);
  console.log('[KYC][mock] verifyBankAccount (penny drop)', ifsc, accountNumber.slice(-4));
  if (!isValidBankAccount(accountNumber)) {
    return { success: false, message: 'Invalid bank account number', referenceId: '' };
  }
  if (!isValidIFSC(ifsc)) {
    return { success: false, message: 'Invalid IFSC code', referenceId: '' };
  }
  if (!accountHolder || accountHolder.trim().length < 2) {
    return { success: false, message: 'Account holder name is required', referenceId: '' };
  }
  const bankCode = ifsc.slice(0, 4).toUpperCase();
  const bankMap: Record<string, string> = {
    HDFC: 'HDFC Bank',
    ICIC: 'ICICI Bank',
    SBIN: 'State Bank of India',
    AXIS: 'Axis Bank',
    KKBK: 'Kotak Mahindra Bank',
    PUNB: 'Punjab National Bank',
    UTIB: 'Axis Bank',
    YESB: 'YES Bank',
    IDFB: 'IDFC First Bank',
    BARB: 'Bank of Baroda',
  };
  return {
    success: true,
    message: 'Bank account verified via penny-drop',
    referenceId: generateRefId('BANK'),
    bankName: bankMap[bankCode] ?? 'Verified Bank',
  };
}

export async function verifyPAN(
  pan: string,
  nameOnPan: string
): Promise<{ success: boolean; message: string; referenceId: string }> {
  await delay(800);
  console.log('[KYC][mock] verifyPAN', pan);
  if (!isValidPAN(pan)) {
    return { success: false, message: 'Invalid PAN format', referenceId: '' };
  }
  if (!nameOnPan || nameOnPan.trim().length < 2) {
    return { success: false, message: 'Name on PAN is required', referenceId: '' };
  }
  return { success: true, message: 'PAN verified with NSDL', referenceId: generateRefId('PAN') };
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
  panVerified?: boolean;
  bankVerified?: boolean;
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

  const bankOk = input.bankVerified ?? false;
  const panDbOk = input.panVerified ?? false;
  const required = aadhaarOk && panOk && selfieMatch && (input.otpVerified ?? true) && panDbOk && bankOk;
  const optionalValid = (passportOk ?? true) && (dlOk ?? true);

  const score =
    (aadhaarOk ? 25 : 0) +
    (panOk ? 15 : 0) +
    (panDbOk ? 15 : 0) +
    (selfieMatch ? 20 : 0) +
    (input.otpVerified ? 10 : 0) +
    (bankOk ? 15 : 0);

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
            : !panDbOk
              ? 'PAN database verification failed'
              : !bankOk
                ? 'Bank account verification failed'
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
  isValidIFSC,
  isValidBankAccount,
  sendAadhaarOTP,
  verifyAadhaarOTP,
  verifyKYC,
  verifyPAN,
  verifyBankAccount,
} as const;
