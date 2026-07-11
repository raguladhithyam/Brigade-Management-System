import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, Plus, Pencil, Trash2, RefreshCw, Search, X, ShieldAlert, MapPin, Phone } from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePaginatedCollection } from '@/hooks/usePaginatedCollection';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationBar } from '@/components/ui/pagination-bar';
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

interface Brigade {
  id: string;
  bnameno: string;
  blname: string;
  blno: string;
  venue: string;
}

const emptyForm = { bnameno: '', blname: '', blno: '', venue: '' };

const BrigadesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    rows,
    loading,
    totalCount,
    page,
    pageSize,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
  } = usePaginatedCollection<Brigade>('brigades', 'bnameno', 20);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<Brigade | null | 'none'>(null);
  const [searching, setSearching] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brigade | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Brigade | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (brigade: Brigade) => {
    setEditing(brigade);
    setForm({ bnameno: brigade.bnameno, blname: brigade.blname, blno: brigade.blno, venue: brigade.venue });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const bnameno = form.bnameno.trim();
    const blname = form.blname.trim();
    const blno = form.blno.trim();
    const venue = form.venue.trim();
    if (!bnameno || !blname || !blno || !venue) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!/^\d{10}$/.test(blno)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setSaving(true);
    try {
      if (!editing) {
        const existing = await getDoc(doc(db, 'brigades', bnameno));
        if (existing.exists()) {
          toast.error(`Brigade ${bnameno} already exists`);
          setSaving(false);
          return;
        }
      }
      await setDoc(doc(db, 'brigades', bnameno), { bnameno, blname, blno, venue });
      toast.success(editing ? 'Brigade updated' : 'Brigade created');
      setFormOpen(false);
      refresh();
    } catch (err) {
      console.error('Failed to save brigade:', err);
      toast.error('Failed to save brigade');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteDoc(doc(db, 'brigades', toDelete.id));
      toast.success(`Deleted brigade ${toDelete.bnameno}`);
      setToDelete(null);
      refresh();
    } catch (err) {
      console.error('Failed to delete brigade:', err);
      toast.error('Failed to delete brigade');
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      let deleted = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const snap = await getDocs(query(collection(db, 'brigades'), limit(500)));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
      }
      toast.success(`Deleted all ${deleted.toLocaleString()} brigades`);
      setDeleteAllOpen(false);
      setDeleteAllText('');
      refresh();
    } catch (err) {
      console.error('Failed to delete all brigades:', err);
      toast.error('Failed to delete all brigades');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      setSearchResult(null);
      return;
    }
    setSearching(true);
    try {
      const snap = await getDoc(doc(db, 'brigades', term));
      setSearchResult(snap.exists() ? ({ id: snap.id, ...snap.data() } as Brigade) : 'none');
    } catch (err) {
      console.error('Search failed:', err);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
  };

  const displayedRows: Brigade[] =
    searchResult && searchResult !== 'none' ? [searchResult] : searchResult === 'none' ? [] : rows;
  const isSearchView = searchResult !== null;

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Brigades</h1>
              <p className="text-sm text-muted-foreground">
                {totalCount.toLocaleString()} {totalCount === 1 ? 'brigade' : 'brigades'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/brigades/upload')}>
              <Upload className="h-4 w-4" /> Bulk Upload
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Brigade
            </Button>
          </div>
        </motion.div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exact brigade number…"
                  className="pl-9"
                />
                {isSearchView && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="secondary" disabled={searching}>
                {searching ? <LoadingSpinner size="sm" /> : 'Search'}
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteAllOpen(true)}
                disabled={totalCount === 0}
              >
                <Trash2 className="h-4 w-4" /> Delete All
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-0">
          {loading && !isSearchView ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" text="Loading brigades…" className="text-primary" />
            </div>
          ) : displayedRows.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {isSearchView ? 'No brigade matches that number.' : 'No brigades yet.'}
              </p>
              {!isSearchView && (
                <Button size="sm" onClick={openAdd} className="mt-2">
                  <Plus className="h-4 w-4" /> Create your first brigade
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brigade</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRows.map((brigade) => (
                    <TableRow key={brigade.id}>
                      <TableCell>
                        <Badge>{brigade.bnameno}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{brigade.blname}</TableCell>
                      <TableCell>
                        <a
                          href={`tel:+91${brigade.blno}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" /> {brigade.blno}
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-success" /> {brigade.venue}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(brigade)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setToDelete(brigade)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!isSearchView && (
                <div className="px-4 pb-4">
                  <PaginationBar
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    rowsOnPage={rows.length}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onPrev={prevPage}
                    onNext={nextPage}
                    onPageSizeChange={setPageSize}
                    loading={loading}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Add / Edit modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Brigade' : 'Add Brigade'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the brigade details below.' : 'Create a new brigade with its lead and venue.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bnameno">Brigade Number</Label>
              <Input
                id="bnameno"
                value={form.bnameno}
                onChange={(e) => setForm({ ...form, bnameno: e.target.value })}
                placeholder="e.g., BG001"
                disabled={!!editing || saving}
              />
              {editing && (
                <p className="text-xs text-muted-foreground">Brigade number is the record ID and cannot be changed.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="blname">Lead Name</Label>
              <Input
                id="blname"
                value={form.blname}
                onChange={(e) => setForm({ ...form, blname: e.target.value })}
                placeholder="Brigade lead full name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blno">Lead Phone</Label>
              <Input
                id="blno"
                value={form.blno}
                onChange={(e) => setForm({ ...form, blno: e.target.value })}
                placeholder="10-digit phone number"
                inputMode="numeric"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g., Main Hall A"
                disabled={saving}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <LoadingSpinner size="sm" /> : editing ? 'Save Changes' : 'Create Brigade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete one */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this brigade?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes brigade{' '}
              <span className="font-medium text-foreground">{toDelete?.bnameno}</span> ({toDelete?.blname}). Students
              assigned to it will no longer resolve to a venue. This cannot be undone.
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

      {/* Delete all */}
      <AlertDialog
        open={deleteAllOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteAllOpen(false);
            setDeleteAllText('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle>Delete ALL brigades?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all{' '}
              <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> brigade records.
              This cannot be undone. Type <span className="font-mono font-semibold text-foreground">DELETE</span> to
              confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteAllText}
            onChange={(e) => setDeleteAllText(e.target.value)}
            placeholder="Type DELETE"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAll();
              }}
              disabled={deleteAllText !== 'DELETE' || deletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAll ? <LoadingSpinner size="sm" /> : 'Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default BrigadesPage;
