import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Upload, Plus, Pencil, Trash2, RefreshCw, Search, X, ShieldAlert } from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Student {
  id: string;
  stdroll: string;
  stdname: string;
  stdbg: string;
}

interface BrigadeOption {
  bnameno: string;
  blname: string;
}

const emptyForm = { stdroll: '', stdname: '', stdbg: '' };

const StudentsPage: React.FC = () => {
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
  } = usePaginatedCollection<Student>('students', 'stdroll', 20);

  const [brigadeOptions, setBrigadeOptions] = useState<BrigadeOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<Student | null | 'none'>(null);
  const [searching, setSearching] = useState(false);

  // Add / edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete dialogs
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  const loadBrigadeOptions = async () => {
    if (brigadeOptions.length > 0) return;
    try {
      const q = query(collection(db, 'brigades'), orderBy('bnameno'), limit(1000));
      const snap = await getDocs(q);
      setBrigadeOptions(snap.docs.map((d) => d.data() as BrigadeOption));
    } catch (err) {
      console.error('Failed to load brigades:', err);
    }
  };

  useEffect(() => {
    loadBrigadeOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    loadBrigadeOptions();
    setFormOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({ stdroll: student.stdroll, stdname: student.stdname, stdbg: student.stdbg });
    loadBrigadeOptions();
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const stdroll = form.stdroll.trim().toUpperCase();
    const stdname = form.stdname.trim();
    const stdbg = form.stdbg.trim();
    if (!stdroll || !stdname || !stdbg) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      if (!editing) {
        const existing = await getDoc(doc(db, 'students', stdroll));
        if (existing.exists()) {
          toast.error(`Roll number ${stdroll} already exists`);
          setSaving(false);
          return;
        }
      }
      await setDoc(doc(db, 'students', stdroll), { stdroll, stdname, stdbg });
      toast.success(editing ? 'Student updated' : 'Student added');
      setFormOpen(false);
      refresh();
    } catch (err) {
      console.error('Failed to save student:', err);
      toast.error('Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteDoc(doc(db, 'students', toDelete.id));
      toast.success(`Deleted ${toDelete.stdname}`);
      setToDelete(null);
      refresh();
    } catch (err) {
      console.error('Failed to delete student:', err);
      toast.error('Failed to delete student');
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      let deleted = 0;
      // Delete in batches of 500 (Firestore batch limit) until the collection is empty.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const snap = await getDocs(query(collection(db, 'students'), limit(500)));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deleted += snap.size;
      }
      toast.success(`Deleted all ${deleted.toLocaleString()} students`);
      setDeleteAllOpen(false);
      setDeleteAllText('');
      refresh();
    } catch (err) {
      console.error('Failed to delete all students:', err);
      toast.error('Failed to delete all students');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toUpperCase();
    if (!term) {
      setSearchResult(null);
      return;
    }
    setSearching(true);
    try {
      const snap = await getDoc(doc(db, 'students', term));
      setSearchResult(snap.exists() ? ({ id: snap.id, ...snap.data() } as Student) : 'none');
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

  const displayedRows: Student[] =
    searchResult && searchResult !== 'none' ? [searchResult] : searchResult === 'none' ? [] : rows;
  const isSearchView = searchResult !== null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Students</h1>
              <p className="text-sm text-muted-foreground">
                {totalCount.toLocaleString()} registered {totalCount === 1 ? 'student' : 'students'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/students/upload')}>
              <Upload className="h-4 w-4" /> Bulk Upload
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </div>
        </motion.div>

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exact roll number…"
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

        {/* Table */}
        <Card className="p-0">
          {loading && !isSearchView ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" text="Loading students…" className="text-primary" />
            </div>
          ) : displayedRows.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {isSearchView ? 'No student matches that roll number.' : 'No students yet.'}
              </p>
              {!isSearchView && (
                <Button size="sm" onClick={openAdd} className="mt-2">
                  <Plus className="h-4 w-4" /> Add your first student
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Brigade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRows.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.stdroll}</TableCell>
                      <TableCell>{student.stdname}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.stdbg}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(student)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setToDelete(student)}
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
            <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the student details below.'
                : 'Register a new student and assign them to a brigade.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stdroll">Roll Number</Label>
              <Input
                id="stdroll"
                value={form.stdroll}
                onChange={(e) => setForm({ ...form, stdroll: e.target.value })}
                placeholder="e.g., 15394"
                disabled={!!editing || saving}
              />
              {editing && (
                <p className="text-xs text-muted-foreground">Roll number is the record ID and cannot be changed.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stdname">Student Name</Label>
              <Input
                id="stdname"
                value={form.stdname}
                onChange={(e) => setForm({ ...form, stdname: e.target.value })}
                placeholder="Full name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Brigade</Label>
              {brigadeOptions.length > 0 ? (
                <Select value={form.stdbg} onValueChange={(v) => setForm({ ...form, stdbg: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brigade" />
                  </SelectTrigger>
                  <SelectContent>
                    {brigadeOptions.map((b) => (
                      <SelectItem key={b.bnameno} value={b.bnameno}>
                        {b.bnameno} — {b.blname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.stdbg}
                  onChange={(e) => setForm({ ...form, stdbg: e.target.value })}
                  placeholder="Brigade number (no brigades found — type manually)"
                  disabled={saving}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <LoadingSpinner size="sm" /> : editing ? 'Save Changes' : 'Add Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete one */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this student?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <span className="font-medium text-foreground">{toDelete?.stdname}</span>{' '}
              ({toDelete?.stdroll}). This action cannot be undone.
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
            <AlertDialogTitle>Delete ALL students?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all{' '}
              <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> student records.
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

export default StudentsPage;
