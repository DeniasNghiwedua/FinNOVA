/** Persistent account service for FINOVA. Requires Node >=22.13 (node:sqlite).
 * Passwords are scrypt-hashed; only random session token hashes are persisted.
 */
import {DatabaseSync} from 'node:sqlite';
import {scrypt as scryptCb, randomBytes, createHash, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import path from 'node:path';
import {mkdirSync} from 'node:fs';
const scrypt=promisify(scryptCb);
const dataDir=path.resolve(process.env.FINOVA_DATA_DIR||path.join(process.cwd(),'finova-private-data'));
mkdirSync(dataDir,{recursive:true,mode:0o700});
const db=new DatabaseSync(path.join(dataDir,'accounts.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS workspaces(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, revision INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL DEFAULT '{}');`);
const hashToken=t=>createHash('sha256').update(t).digest('hex');
const b64=n=>randomBytes(n).toString('base64url');
const safeName=n=>typeof n==='string'&&n.trim().length>=2&&n.trim().length<=45;
const safeEmail=e=>typeof e==='string'&&e.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const sessionCookie=(token,secure)=>`finova_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure?'; Secure':''}`;
export function userFromRequest(req){const token=(req.headers.cookie||'').match(/(?:^|;\s*)finova_session=([A-Za-z0-9_-]+)/)?.[1];if(!token)return null;const record=db.prepare('SELECT users.id,users.name,users.email FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?').get(hashToken(token),Date.now());return record||null;}
function newSession(user,secure){const token=b64(32);db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').run(hashToken(token),user.id,Date.now()+604800000);return {user:{id:user.id,name:user.name,email:user.email},cookie:sessionCookie(token,secure)};}
export async function register({email,name,password},secure=false){email=String(email||'').trim().toLowerCase();if(!safeEmail(email)||!safeName(name)||typeof password!=='string'||password.length<12||password.length>128)throw Object.assign(new Error('Enter a valid email, name (2–45 characters) and password (12–128 characters).'),{status:400});if(db.prepare('SELECT 1 FROM users WHERE email=?').get(email))throw Object.assign(new Error('Email address already registered.'),{status:409});const id=b64(18),salt=b64(20),hash=(await scrypt(password,salt,64)).toString('hex');db.prepare('INSERT INTO users VALUES (?,?,?,?,?,?)').run(id,email,name.trim(),salt,hash,Date.now());db.prepare('INSERT INTO workspaces(user_id,revision,data) VALUES (?,0,?)').run(id,JSON.stringify({transactions:[],budgets:{},goals:[],recurring:[],prefs:{displayName:name.trim(),theme:'dark'}}));return newSession({id,email,name:name.trim()},secure);}
export async function login({email,password},secure=false){email=String(email||'').trim().toLowerCase();const row=db.prepare('SELECT * FROM users WHERE email=?').get(email);const dummySalt='K2k8xR7YRQvYtDlgbN9hXb7GFIU';const candidate=(await scrypt(String(password||''),row?.salt||dummySalt,64));const expected=Buffer.from(row?.hash||'00'.repeat(64),'hex');if(!row||!timingSafeEqual(candidate,expected))throw Object.assign(new Error('Incorrect email or password.'),{status:401});return newSession(row,secure);}
export function logout(req){const token=(req.headers.cookie||'').match(/(?:^|;\s*)finova_session=([A-Za-z0-9_-]+)/)?.[1];if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token));}
export function getWorkspace(id){const row=db.prepare('SELECT revision,data FROM workspaces WHERE user_id=?').get(id);return {revision:row?.revision||0,data:row?JSON.parse(row.data):{}};}
export function putWorkspace(id,data,revision){if(!Number.isSafeInteger(revision)||revision<0)throw Object.assign(new Error('Missing workspace revision.'),{status:400});const json=JSON.stringify(data);if(json.length>1_000_000)throw Object.assign(new Error('Workspace exceeds the 1 MB limit.'),{status:413});const validTransactions=Array.isArray(data?.transactions)&&data.transactions.length<=3000&&data.transactions.every(t=>typeof t.id==='string'&&t.id.length<=100&&typeof t.description==='string'&&t.description.length<=150&&Number.isSafeInteger(t.cents)&&t.cents>0&&['income','expense'].includes(t.type)&&/^\d{4}-\d{2}-\d{2}$/.test(t.date));if(!validTransactions||!data.budgets||!Array.isArray(data.goals)||!Array.isArray(data.recurring)||data.goals.length>500||data.recurring.length>500||typeof data.prefs?.displayName!=='string')throw Object.assign(new Error('Invalid workspace data.'),{status:400});const changed=db.prepare('UPDATE workspaces SET data=?,revision=revision+1 WHERE user_id=? AND revision=?').run(json,id,revision);if(changed.changes!==1)throw Object.assign(new Error('Workspace changed in another session; reload before saving.'),{status:409});return {revision:revision+1};}
export const clearCookie=secure=>`finova_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure?'; Secure':''}`;
