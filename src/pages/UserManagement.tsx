import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserCog, Plus, Pencil, Trash2, KeyRound, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ManagedUser,
  USER_BACKEND_READY,
  BackendNotConfiguredError,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  setUserPassword,
} from '@/lib/userService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendMissing, setBackendMissing] = useState(!USER_BACKEND_READY);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState({ email: '', displayName: '', password: '', disabled: false });
  const [saving, setSaving] = useState(false);

  const [pwUser, setPwUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [toDelete, setToDelete] = useState<ManagedUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
      setBackendMissing(false);
    } catch (err) {
      if (err instanceof BackendNotConfiguredError) {
        setBackendMissing(true);
      } else {
        console.error('Failed to load users:', err);
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleServiceError = (err: unknown, fallback: string) => {
    if (err instanceof BackendNotConfiguredError) {
      toast.error('Backend not configured', {
        description: 'Deploy the Admin Cloud Functions to enable this action.',
      });
    } else {
      console.error(err);
      toast.error(fallback);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ email: '', displayName: '', password: '', disabled: false });
    setFormOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditing(user);
    setForm({ email: user.email, displayName: user.displayName ?? '', password: '', disabled: user.disabled });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && (!form.email.trim() || !form.password.trim())) {
      toast.error('Email and password are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateUser(editing.uid, { displayName: form.displayName.trim(), disabled: form.disabled });
        toast.success('User updated');
      } else {
        await createUser({
          email: form.email.trim(),
          password: form.password,
          displayName: form.displayName.trim() || undefined,
        });
        toast.success('User created');
      }
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      handleServiceError(err, 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      await setUserPassword(pwUser.uid, newPassword);
      toast.success(`Password updated for ${pwUser.email}`);
      setPwUser(null);
      setNewPassword('');
    } catch (err) {
      handleServiceError(err, 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteUser(toDelete.uid);
      toast.success(`Deleted ${toDelete.email}`);
      setToDelete(null);
      fetchUsers();
    } catch (err) {
      handleServiceError(err, 'Failed to delete user');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <UserCog className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-sm text-muted-foreground">Manage admin accounts and access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
        </motion.div>

        {backendMissing && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Admin backend not connected yet</p>
              <p className="text-amber-800">
                Firebase Auth users can't be listed or edited from the browser. This page is fully built and wired to a
                service layer — deploy the Admin SDK Cloud Functions (<span className="font-mono">listUsers</span>,{' '}
                <span className="font-mono">createUser</span>, <span className="font-mono">updateUser</span>,{' '}
                <span className="font-mono">deleteUser</span>, <span className="font-mono">setUserPassword</span>) and set{' '}
                <span className="font-mono">USER_BACKEND_READY = true</span> in{' '}
                <span className="font-mono">src/lib/userService.ts</span> to activate it.
              </p>
            </div>
          </div>
        )}

        <Card className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" text="Loading users…" className="text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <UserCog className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {backendMissing ? 'Connect the backend to list users.' : 'No users found.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sign-in</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.displayName || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      {user.disabled ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.lastSignInAt ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPwUser(user)} title="Change password">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setToDelete(user)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Add / Edit user modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update this admin account.' : 'Create a new admin account.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                disabled={!!editing || saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Optional"
                disabled={saving}
              />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  disabled={saving}
                />
              </div>
            )}
            {editing && (
              <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                <input
                  type="checkbox"
                  checked={form.disabled}
                  onChange={(e) => setForm({ ...form, disabled: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                  disabled={saving}
                />
                <span className="text-sm">
                  <span className="font-medium">Disable this account</span>
                  <span className="block text-muted-foreground">Disabled users cannot sign in.</span>
                </span>
              </label>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <LoadingSpinner size="sm" /> : editing ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change password modal */}
      <Dialog open={!!pwUser} onOpenChange={(open) => !open && (setPwUser(null), setNewPassword(''))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Change Password
            </DialogTitle>
            <DialogDescription>Set a new password for {pwUser?.email}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={pwSaving}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPwUser(null);
                  setNewPassword('');
                }}
                disabled={pwSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pwSaving}>
                {pwSaving ? <LoadingSpinner size="sm" /> : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-medium text-foreground">{toDelete?.email}</span> and
              revokes their access. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default UserManagement;
