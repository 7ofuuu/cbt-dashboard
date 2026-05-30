'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSubjectTheme } from '@/hooks/useSubjectTheme';
import { Lock } from 'lucide-react';

/**
 * Subject picker that follows subject-based access:
 * - Regular teacher: locked to their own subject (read-only badge, auto-synced to parent state).
 * - Coordinator/Admin: full dropdown of every active subject from the dynamic taxonomy.
 *
 * Mirrors the backend rule in subjectAccessService.getSubjectForCreate.
 */
export function SubjectSelect({
  value,
  onChange,
  label = 'Mata Pelajaran',
  required = false,
  id = 'subject',
  disabled = false,
  className = '',
}) {
  const { user } = useAuthContext();
  const { subjects } = useTaxonomy();
  const isCoordinator = user?.is_coordinator === true;
  const teacherSubject = user?.subject || null;

  // Regular teacher: keep parent state pinned to their own subject.
  useEffect(() => {
    if (!isCoordinator && teacherSubject && value !== teacherSubject) {
      onChange(teacherSubject);
    }
  }, [isCoordinator, teacherSubject, value, onChange]);

  const labelEl = (
    <Label htmlFor={id} className="text-xs">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
  );

  if (isCoordinator) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {labelEl}
        <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={id} className="h-9">
            <SelectValue placeholder="Pilih Mata Pelajaran" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.subject_id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (!teacherSubject) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {labelEl}
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
          Profil Anda belum memiliki mata pelajaran. Hubungi admin.
        </p>
      </div>
    );
  }

  const theme = useSubjectTheme(teacherSubject);
  return (
    <div className={`space-y-1.5 ${className}`}>
      {labelEl}
      <div className="flex items-center gap-2 h-9">
        <Badge className={`${theme.badge} gap-1.5`} variant="secondary">
          <Lock className="w-3 h-3" />
          {teacherSubject}
        </Badge>
        <span className="text-[11px] text-muted-foreground">Sesuai mapel yang Anda ampu</span>
      </div>
    </div>
  );
}

export default SubjectSelect;
