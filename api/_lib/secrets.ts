import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'firebase-applet-config.json');

export const getFirebaseConfig = () => {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed to read firebase-applet-config.json', err);
    return null;
  }
};

export const getSecrets = async () => {
  if (process.env.ADMIN_PIN || process.env.SANKA_API_KEY || process.env.VELIXS_API_KEY) {
    return {
      apiKey: process.env.SANKA_API_KEY || 'planaai',
      apiKey2: process.env.VELIXS_API_KEY || '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4',
      adminPin: process.env.ADMIN_PIN || ''
    };
  }

  const config = getFirebaseConfig();
  if (!config) return { apiKey: 'planaai', apiKey2: '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4', adminPin: '' };

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/admin/secrets?key=${config.apiKey}`;
  
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const fields = data.fields || {};
      return {
        apiKey: fields.apiKey?.stringValue || 'planaai',
        apiKey2: fields.apiKey2?.stringValue || '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4',
        adminPin: fields.adminPin?.stringValue || ''
      };
    }
  } catch (err) {
    console.error('Failed to fetch secrets from Firestore', err);
  }
  
  return { apiKey: 'planaai', apiKey2: '20444144e6e22f545cd0b9d2f0b8f6a26754911dee37aab2f4', adminPin: '' };
};

export const saveSecrets = async (secrets: any) => {
  const config = getFirebaseConfig();
  if (!config) return;

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/admin/secrets?key=${config.apiKey}`;
  
  const body = {
    fields: {
      apiKey: { stringValue: secrets.apiKey || '' },
      apiKey2: { stringValue: secrets.apiKey2 || '' },
      adminPin: { stringValue: secrets.adminPin || '' }
    }
  };

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('Failed to save secrets to Firestore', err);
  }
};
