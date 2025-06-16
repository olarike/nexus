import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const LOCAL_DIR = path.join(__dirname, '..', '..', '.local');
const ADMIN_KEYPAIR_PATH = path.join(LOCAL_DIR, 'admin-keypair.json');

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function createAdminKeypair() {
  if (fs.existsSync(ADMIN_KEYPAIR_PATH)) {
    console.log('Admin keypair already exists at', ADMIN_KEYPAIR_PATH);
    return;
  }

  const keypair = Keypair.generate();
  const secretKey = Array.from(keypair.secretKey);

  ensureDirectoryExistence(ADMIN_KEYPAIR_PATH);
  fs.writeFileSync(ADMIN_KEYPAIR_PATH, JSON.stringify(secretKey));
  console.log('Generated new admin keypair and saved to', ADMIN_KEYPAIR_PATH);
}

createAdminKeypair(); 