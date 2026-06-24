'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Home, Plus, Edit, EyeOff, Eye, RefreshCw, Loader2, Database, BookOpen, GraduationCap, Layers, Check } from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import request from '@/utils/request';
import toast from 'react-hot-toast';

const COLOR_HEX = {
  blue: '#3b82f6', green: '#22c55e', pink: '#ec4899', sky: '#0ea5e9',
  fuchsia: '#d946ef', emerald: '#10b981', amber: '#f59e0b', lime: '#84cc16',
  orange: '#f97316', rose: '#f43f5e', red: '#ef4444', violet: '#8b5cf6',
  teal: '#14b8a6', indigo: '#6366f1', cyan: '#06b6d4',
};

// Preset swatches for quick pick (HEX values, curated palette)
const SUBJECT_COLOR_PRESETS = [
  '#3b82f6', '#22c55e', '#ec4899', '#0ea5e9', '#d946ef', '#10b981',
  '#f59e0b', '#84cc16', '#f97316', '#f43f5e', '#ef4444', '#8b5cf6',
  '#14b8a6', '#6366f1', '#06b6d4',
];

// Accept any color value: HEX (#abc123) passes through; legacy name resolves via COLOR_HEX.
const resolveColor = (v) => {
  if (!v) return null;
  if (typeof v === 'string' && v.startsWith('#')) return v;
  return COLOR_HEX[v] || null;
};

export default function MasterDataPage() {
  useAuth(['admin']);
  const { refresh } = useTaxonomy();

  const [tab, setTab] = useState('subjects');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [majors, setMajors] = useState([]);

  // Modal states - one dialog reused per tab
  const [editing, setEditing] = useState(null); // { kind, item } | null
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await request.get('/taxonomy', { params: { include_inactive: 'true' } });
      setSubjects(res.data.subjects || []);
      setGradeLevels(res.data.grade_levels || []);
      setMajors(res.data.majors || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal memuat master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Dispatch save based on dialog kind
  const handleSave = async (form) => {
    setSaving(true);
    try {
      const { kind, item } = editing;
      const isNew = !item;
      const url = isNew
        ? `/taxonomy/${kind}`
        : `/taxonomy/${kind}/${item[kind === 'subjects' ? 'subject_id' : kind === 'grade-levels' ? 'grade_level_id' : 'major_id']}`;
      const method = isNew ? 'post' : 'put';

      await request[method](url, { ...form });
      toast.success('Tersimpan');

      setEditing(null);
      await loadAll();
      await refresh(); // invalidate the global cache so dropdowns elsewhere pick up changes
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async ({ kind, id }) => {
    try {
      await request.delete(`/taxonomy/${kind}/${id}`);
      toast.success('Dinonaktifkan');
      setShowDeactivateConfirm(null);
      await loadAll();
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menonaktifkan');
    }
  };

  const handleReactivate = async ({ kind, id }) => {
    try {
      await request.put(`/taxonomy/${kind}/${id}`, { is_active: true });
      toast.success('Diaktifkan kembali');
      await loadAll();
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal mengaktifkan');
    }
  };

  return (
    <AdminLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Master Data</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Master Data"
        description="Kelola mata pelajaran, tingkat, dan jurusan. Perubahan langsung dipakai di seluruh aplikasi."
      >
        <Button onClick={loadAll} variant="outline" size="sm">
          <RefreshCw className='w-4 h-4 mr-2' /> Segarkan
        </Button>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="subjects" className="gap-2">
            <BookOpen className="w-4 h-4" /> Mata Pelajaran ({subjects.length})
          </TabsTrigger>
          <TabsTrigger value="grade-levels" className="gap-2">
            <GraduationCap className="w-4 h-4" /> Tingkat ({gradeLevels.length})
          </TabsTrigger>
          <TabsTrigger value="majors" className="gap-2">
            <Layers className="w-4 h-4" /> Jurusan ({majors.length})
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Memuat...</span>
          </div>
        ) : (
          <>
            <TabsContent value="subjects" className="mt-4">
              <TaxonomyTable
                kind="subjects"
                items={subjects}
                idKey="subject_id"
                columns={[
                  { key: 'name', label: 'Nama', primary: true },
                  { key: 'color', label: 'Warna', render: (v) => {
                    const hex = resolveColor(v);
                    if (!hex) return '-';
                    return (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: hex }} />
                        <span className="text-xs text-gray-600 font-mono">{hex.toUpperCase()}</span>
                      </span>
                    );
                  } },
                  { key: 'sort_order', label: 'Urutan' },
                ]}
                onAdd={() => setEditing({ kind: 'subjects', item: null })}
                onEdit={(item) => setEditing({ kind: 'subjects', item })}
                onDeactivate={(item) => setShowDeactivateConfirm({ kind: 'subjects', id: item.subject_id, label: item.name })}
                onReactivate={(item) => handleReactivate({ kind: 'subjects', id: item.subject_id })}
              />
            </TabsContent>

            <TabsContent value="grade-levels" className="mt-4">
              <TaxonomyTable
                kind="grade-levels"
                items={gradeLevels}
                idKey="grade_level_id"
                columns={[
                  { key: 'value', label: 'Kode', primary: true },
                  { key: 'label', label: 'Label' },
                  { key: 'sort_order', label: 'Urutan' },
                ]}
                onAdd={() => setEditing({ kind: 'grade-levels', item: null })}
                onEdit={(item) => setEditing({ kind: 'grade-levels', item })}
                onDeactivate={(item) => setShowDeactivateConfirm({ kind: 'grade-levels', id: item.grade_level_id, label: item.label })}
                onReactivate={(item) => handleReactivate({ kind: 'grade-levels', id: item.grade_level_id })}
              />
            </TabsContent>

            <TabsContent value="majors" className="mt-4">
              <TaxonomyTable
                kind="majors"
                items={majors}
                idKey="major_id"
                columns={[
                  { key: 'value', label: 'Kode', primary: true },
                  { key: 'label', label: 'Label' },
                  { key: 'sort_order', label: 'Urutan' },
                ]}
                onAdd={() => setEditing({ kind: 'majors', item: null })}
                onEdit={(item) => setEditing({ kind: 'majors', item })}
                onDeactivate={(item) => setShowDeactivateConfirm({ kind: 'majors', id: item.major_id, label: item.label })}
                onReactivate={(item) => handleReactivate({ kind: 'majors', id: item.major_id })}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Edit/create dialog */}
      <EditDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        saving={saving}
      />

      {/* Deactivate confirmation */}
      <AlertDialog open={!!showDeactivateConfirm} onOpenChange={(open) => !open && setShowDeactivateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan {showDeactivateConfirm?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tidak akan muncul lagi di dropdown atau filter. Data historis (ujian, bank soal, siswa) yang sudah memakai nilai ini <strong>tetap utuh</strong> dan tidak terpengaruh. Anda dapat mengaktifkan kembali kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeactivate(showDeactivateConfirm)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Ya, Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

// ---------------------------------------------------------------------------
// Table component - reused for all 3 taxonomies
// ---------------------------------------------------------------------------
function TaxonomyTable({ kind, items, idKey, columns, onAdd, onEdit, onDeactivate, onReactivate }) {
  const [showInactive, setShowInactive] = useState(false);
  const visible = items.filter((item) => showInactive || item.is_active);
  const inactiveCount = items.filter((item) => !item.is_active).length;

  const labelSingular = kind === 'subjects' ? 'Mata Pelajaran' : kind === 'grade-levels' ? 'Tingkat' : 'Jurusan';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">{labelSingular}</h3>
            {inactiveCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInactive((s) => !s)}
                className="text-xs h-7"
              >
                {showInactive ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
                {showInactive ? 'Sembunyikan' : 'Tampilkan'} {inactiveCount} non-aktif
              </Button>
            )}
          </div>
          <Button onClick={onAdd} size="sm" className="bg-[#03356C] hover:bg-[#02509E] text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Tambah {labelSingular}
          </Button>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Database className="w-10 h-10 mx-auto mb-2 opacity-40" />
            Belum ada data
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="text-left px-4 py-2.5 font-medium text-xs text-gray-600">{col.label}</th>
                  ))}
                  <th className="text-center px-4 py-2.5 font-medium text-xs text-gray-600 w-32">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-gray-600 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((item) => (
                  <tr key={item[idKey]} className={`hover:bg-gray-50/50 ${!item.is_active ? 'opacity-60' : ''}`}>
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-2.5 ${col.primary ? 'font-medium' : 'text-gray-600'}`}>
                        {col.render ? col.render(item[col.key], item) : (item[col.key] ?? '-')}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center">
                      {item.is_active ? (
                        <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-500 bg-gray-50 text-xs">Non-aktif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(item)} title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        {item.is_active ? (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => onDeactivate(item)} title="Nonaktifkan">
                            <EyeOff className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onReactivate(item)} title="Aktifkan">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add/Edit dialog - adapts fields per kind
// ---------------------------------------------------------------------------
function EditDialog({ editing, onClose, onSave, saving }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!editing) return;
    if (editing.item) {
      setForm({ ...editing.item });
    } else {
      // sensible defaults for "create" mode
      setForm(editing.kind === 'subjects'
        ? { name: '', color: '#3b82f6', sort_order: 0 }
        : { value: '', label: '', sort_order: 0 });
    }
  }, [editing]);

  if (!editing) return null;

  const isSubjects = editing.kind === 'subjects';
  const isEdit = !!editing.item;
  const titleNoun = isSubjects ? 'Mata Pelajaran' : editing.kind === 'grade-levels' ? 'Tingkat' : 'Jurusan';

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={!!editing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Tambah'} {titleNoun}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perubahan langsung muncul di dropdown & filter setelah disimpan.'
              : 'Akan tersedia di semua dropdown dan filter setelah disimpan.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          {isSubjects ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Nama <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  required
                  disabled={isEdit}
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Matematika"
                />
                {isEdit && (
                  <p className="text-[11px] text-muted-foreground">Nama tidak bisa diubah setelah dibuat.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Warna Tema</Label>
                <SubjectColorPicker
                  value={resolveColor(form.color) || '#3b82f6'}
                  onChange={(hex) => setForm({ ...form, color: hex })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="value" className="text-xs">Kode <span className="text-red-500">*</span></Label>
                <Input
                  id="value"
                  required
                  disabled={isEdit}
                  value={form.value || ''}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={editing.kind === 'grade-levels' ? 'Contoh: X, XI, XII' : 'Contoh: IPA, IPS'}
                />
                <p className="text-[11px] text-muted-foreground">
                  {isEdit
                    ? 'Kode tidak bisa diubah setelah dibuat.'
                    : 'Nilai yang disimpan di data ujian & siswa.'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="label" className="text-xs">Label Tampilan <span className="text-red-500">*</span></Label>
                <Input
                  id="label"
                  required
                  value={form.label || ''}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder={editing.kind === 'grade-levels' ? 'Contoh: Kelas 10' : 'Contoh: IPA'}
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sort_order" className="text-xs">Urutan</Label>
            <Input
              id="sort_order"
              type="number"
              value={form.sort_order ?? 0}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={saving} className="bg-[#03356C] hover:bg-[#02509E] text-white">
              {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</> : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Subject color picker - HEX slider + manual input + preset swatches
// ---------------------------------------------------------------------------
function SubjectColorPicker({ value, onChange }) {
  const safe = (value || '#3b82f6').toUpperCase();
  return (
    <div className="border rounded-md p-3 bg-gray-50 space-y-3">
      <div className="flex gap-3">
        {/* Slider panel (saturation + hue) */}
        <div className="shrink-0">
          <HexColorPicker
            color={safe}
            onChange={onChange}
            style={{ width: 180, height: 140 }}
          />
        </div>
        {/* Live preview + HEX input */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Preview</p>
            <div
              className="w-full h-12 rounded-md border border-white shadow-inner"
              style={{ backgroundColor: safe }}
            />
          </div>
          <div>
            <Label htmlFor="subject_color_hex" className="text-[11px] text-muted-foreground">Kode HEX</Label>
            <div className="flex items-center mt-1 border rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-gray-400">
              <span className="px-2 text-gray-400 text-sm font-mono">#</span>
              <HexColorInput
                id="subject_color_hex"
                color={safe}
                onChange={onChange}
                prefixed={false}
                className="flex-1 py-1.5 pr-2 text-sm font-mono uppercase outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preset swatches */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">Preset</p>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECT_COLOR_PRESETS.map((hex) => {
            const selected = safe === hex.toUpperCase();
            return (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => onChange(hex)}
                className={`relative w-6 h-6 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 ${selected ? 'ring-2 ring-offset-1 ring-gray-700 scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: hex }}
              >
                {selected && (
                  <Check className="absolute inset-0 m-auto w-3 h-3 text-white drop-shadow" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
