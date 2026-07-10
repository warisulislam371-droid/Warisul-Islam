import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../firebase';

// Keep the access token in-memory and fallback to localStorage for cross-tab/session persistence
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('GOOGLE_WORKSPACE_ACCESS_TOKEN') : null;
let googleUser: User | null = null;
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem('GOOGLE_WORKSPACE_USER');
  if (storedUser) {
    try {
      googleUser = JSON.parse(storedUser) as User;
    } catch (e) {
      // ignore
    }
  }
}

// Scopes required for Drive and Sheets
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly'
];

/**
 * Initiates the Google Sign-In popup with requested Sheets and Drive scopes
 */
export async function signInWithGoogleForWorkspace(): Promise<{ user: User; accessToken: string }> {
  try {
    const provider = new GoogleAuthProvider();
    GOOGLE_SCOPES.forEach(scope => provider.addScope(scope));
    
    // Force consent prompt to guarantee we get a fresh token with all scopes
    provider.setCustomParameters({
      prompt: 'consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential || !credential.accessToken) {
      throw new Error('No access token returned from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    googleUser = result.user;

    if (typeof window !== 'undefined') {
      localStorage.setItem('GOOGLE_WORKSPACE_ACCESS_TOKEN', credential.accessToken);
      localStorage.setItem('GOOGLE_WORKSPACE_USER', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      }));
    }
    
    return {
      user: result.user,
      accessToken: credential.accessToken
    };
  } catch (error) {
    console.error('Error signing in with Google for workspace:', error);
    throw error;
  }
}

/**
 * Returns the cached in-memory access token, if any
 */
export function getCachedWorkspaceToken(): string | null {
  return cachedAccessToken;
}

/**
 * Returns the authenticated Google User, if any
 */
export function getCachedWorkspaceUser(): User | null {
  return googleUser;
}

/**
 * Signs out and clears cached tokens
 */
export function clearWorkspaceSession() {
  cachedAccessToken = null;
  googleUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('GOOGLE_WORKSPACE_ACCESS_TOKEN');
    localStorage.removeItem('GOOGLE_WORKSPACE_USER');
  }
}

/**
 * Creates a new Google Spreadsheet and returns its ID and URL
 */
export async function createGoogleSpreadsheet(accessToken: string, title: string): Promise<{ id: string; url: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
}

/**
 * Appends rows of data to a spreadsheet at a specified range
 */
export async function appendRowsToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: range,
      majorDimension: 'ROWS',
      values: values
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append values to spreadsheet: ${response.statusText} - ${errText}`);
  }

  return await response.json();
}

/**
 * Uploads a text or JSON file (e.g. invoice) to Google Drive
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  name: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<{ id: string; url: string }> {
  // We do a simple multipart upload or separate metadata + content upload.
  // Using standard metadata + media multipart upload or a simplified metadata first, then update media.
  // A clean metadata + media approach is to use the Google Drive API's multipart upload.
  const boundary = '314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: name,
    mimeType: mimeType
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: ' + mimeType + '\r\n\r\n' +
    content +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload file to Google Drive: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: `https://drive.google.com/file/d/${data.id}/view`
  };
}
