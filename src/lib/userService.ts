/**
 * User management service layer.
 *
 * Firebase Authentication users CANNOT be listed or administered from the browser:
 * the client SDK only exposes the currently signed-in user. Listing every user,
 * creating/deleting arbitrary users, toggling `disabled`, or setting another user's
 * password all require the Firebase Admin SDK, which must run on a trusted server.
 *
 * The recommended host is a set of Firebase Cloud Functions (Blaze plan) that verify
 * the caller is an admin, then use `admin.auth()`. This module is the single seam the
 * UI talks to — flip `USER_BACKEND_READY` to true and implement the calls below once
 * those functions are deployed. Nothing else in the UI needs to change.
 *
 * Suggested callable Cloud Functions (region us-central1 by default):
 *   - listUsers()                       -> { users: ManagedUser[] }
 *   - createUser({ email, password, displayName }) -> ManagedUser
 *   - updateUser({ uid, displayName, disabled })   -> ManagedUser
 *   - deleteUser({ uid })               -> { ok: true }
 *   - setUserPassword({ uid, password })-> { ok: true }
 *
 * Example implementation of the client call (kept commented until the backend exists):
 *
 *   import { getFunctions, httpsCallable } from 'firebase/functions';
 *   const fns = getFunctions();
 *   const res = await httpsCallable(fns, 'listUsers')();
 *   return (res.data as { users: ManagedUser[] }).users;
 */

export interface ManagedUser {
  uid: string;
  email: string;
  displayName?: string;
  disabled: boolean;
  createdAt?: string;
  lastSignInAt?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface UpdateUserInput {
  displayName?: string;
  disabled?: boolean;
}

/** Flip to true once the Cloud Functions above are deployed and wired below. */
export const USER_BACKEND_READY = false;

/** Thrown when an admin operation is attempted before the backend is deployed. */
export class BackendNotConfiguredError extends Error {
  constructor() {
    super(
      'User management backend is not configured yet. Deploy the Firebase Admin Cloud Functions and set USER_BACKEND_READY = true in src/lib/userService.ts.'
    );
    this.name = 'BackendNotConfiguredError';
  }
}

function ensureReady() {
  if (!USER_BACKEND_READY) throw new BackendNotConfiguredError();
}

export async function listUsers(): Promise<ManagedUser[]> {
  ensureReady();
  // TODO: return (await httpsCallable(getFunctions(), 'listUsers')()).data.users
  return [];
}

export async function createUser(_input: CreateUserInput): Promise<ManagedUser> {
  ensureReady();
  // TODO: return (await httpsCallable(getFunctions(), 'createUser')(_input)).data
  throw new BackendNotConfiguredError();
}

export async function updateUser(_uid: string, _input: UpdateUserInput): Promise<void> {
  ensureReady();
  // TODO: await httpsCallable(getFunctions(), 'updateUser')({ uid: _uid, ..._input })
}

export async function deleteUser(_uid: string): Promise<void> {
  ensureReady();
  // TODO: await httpsCallable(getFunctions(), 'deleteUser')({ uid: _uid })
}

export async function setUserPassword(_uid: string, _password: string): Promise<void> {
  ensureReady();
  // TODO: await httpsCallable(getFunctions(), 'setUserPassword')({ uid: _uid, password: _password })
}
