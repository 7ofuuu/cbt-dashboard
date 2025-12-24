"use client";

import { useState } from "react";
import GuruLayout from "../guruLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Plus, Trash2, Copy, Image, Move, MoreVertical, X, Home } from "lucide-react";
import { useRouter } from 'next/navigation';
import request from '@/utils/request';
import toast from 'react-hot-toast';

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sampleOption() {
  return { id: uid("opt"), text: "Opsi 1", correct: false };
}

export default function TambahSoalPage() {
  useAuth(["guru"]);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [mapel, setMapel] = useState("");
  const [saving, setSaving] = useState(false);

  const mapelLabel = {
    mtk: 'Matematika',
    indo: 'Bahasa Indonesia',
    inggris: 'Bahasa Inggris'
  };

  const validateQuestion = (q) => {
    if (!q.text || q.text.trim() === '') return 'Pertanyaan tidak boleh kosong';
    if (q.type === 'mcq') {
      if (!q.options || q.options.length < 2) return 'Pilihan ganda minimal 2 opsi';
      if (!q.options.some(o => o.text && o.text.trim())) return 'Semua opsi harus diisi';
      if (!q.options.some(o => o.correct)) return 'Tandai satu opsi sebagai jawaban benar';
    }
    return null;
  };

  const handleSave = async () => {
    if (!title || !mapel || !tingkat) {
      toast.error('Isi Judul, Mapel, dan Tingkat terlebih dahulu');
      return;
    }

    if (questions.length === 0) {
      toast.error('Tambahkan minimal 1 pertanyaan');
      return;
    }

    // Validate questions
    for (const q of questions) {
      const err = validateQuestion(q);
      if (err) {
        toast.error(`Pertanyaan ${questions.indexOf(q) + 1}: ${err}`);
        return;
      }
    }

    setSaving(true);
    try {
      let created = 0;
      for (const q of questions) {
        const tipe = q.type === 'mcq' ? 'PILIHAN_GANDA_SINGLE' : 'ESSAY';
        const payload = {
          tipe_soal: tipe,
          teks_soal: q.text,
          mata_pelajaran: mapelLabel[mapel] || mapel,
          tingkat: tingkat,
          jurusan: jurusan || null,
          soal_gambar: null,
          soal_pembahasan: description || null,
        };

        if (q.type === 'mcq') {
          payload.opsi_jawaban = q.options.map((o, idx) => ({
            label: String.fromCharCode(65 + idx),
            teks_opsi: o.text,
            is_benar: !!o.correct,
          }));
        }

        await request.post('/soal', payload);
        created++;
      }

      toast.success(`${created} soal berhasil ditambahkan`);
      router.push('/guru/banksoal');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Gagal menyimpan soal');
    } finally {
      setSaving(false);
    }
  };

  const [questions, setQuestions] = useState(() => [
    {
      id: uid("q"),
      type: "mcq",
      text: "",
      options: [sampleOption(), sampleOption(), sampleOption(), sampleOption()],
      image: null,
    },
  ]);

  function addQuestion(type = "mcq") {
    setQuestions(qs => [
      ...qs,
      { id: uid("q"), type, text: "", options: type === "mcq" ? [sampleOption(), sampleOption(), sampleOption(), sampleOption()] : [], image: null },
    ]);
  }

  function removeQuestion(id) {
    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  function duplicateQuestion(id) {
    setQuestions(qs => {
      const q = qs.find(x => x.id === id);
      if (!q) return qs;
      const copy = { ...q, id: uid("q"), options: q.options.map(o => ({ ...o, id: uid("opt") })) };
      return [...qs, copy];
    });
  }

  function updateQuestion(id, patch) {
    setQuestions(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)));
  }

  function addOption(qid) {
    setQuestions(qs => qs.map(q => (q.id === qid ? { ...q, options: [...q.options, sampleOption()] } : q)));
  }

  function removeOption(qid, optId) {
    setQuestions(qs => qs.map(q => (q.id === qid ? { ...q, options: q.options.filter(o => o.id !== optId) } : q)));
  }

  function setCorrectOption(qid, optId) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qid) return q;
      return { ...q, options: q.options.map(o => ({ ...o, correct: o.id === optId })) };
    }));
  }

  return (
    <GuruLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/guru/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/guru/banksoal'>Bank Soal</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tambah Bank Soal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Bank Soal &gt; Tambah Bank Soal</h2>
            <p className="text-sm text-muted-foreground">Buat bank soal baru dan tambahkan pertanyaan</p>
          </div>
          <div>
            <Button onClick={handleSave} disabled={saving} className="bg-[#03356C] hover:bg-[#02509E] text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Tambahkan'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul Bank Soal (contoh: Matematika)" className="text-lg font-semibold" />
            </CardTitle>
            <CardDescription>
              {/* toolbar placeholder */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 border rounded">B</span>
                <span className="px-2 py-1 border rounded">I</span>
                <span className="px-2 py-1 border rounded">U</span>
                <span className="px-2 py-1 border rounded">S</span>
              </div>
            </CardDescription>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="ml-auto text-sm text-red-600">Hapus Bank Soal</Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4">
              <Textarea placeholder="Deskripsi Bank Soal" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Select value={tingkat} onValueChange={v => setTingkat(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="x">X</SelectItem>
                    <SelectItem value="xi">XI</SelectItem>
                    <SelectItem value="xii">XII</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={jurusan} onValueChange={v => setJurusan(v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ipa">IPA</SelectItem>
                    <SelectItem value="ips">IPS</SelectItem>
                    <SelectItem value="bahasa">Bahasa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={mapel} onValueChange={v => setMapel(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtk">Matematika</SelectItem>
                    <SelectItem value="indo">Bahasa Indonesia</SelectItem>
                    <SelectItem value="inggris">Bahasa Inggris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={q.id} className="border-l-4 border-[#0B4B6F]">
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <Move className="opacity-40" />
                    <div className="text-sm text-muted-foreground">{idx + 1}</div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 rounded px-3 py-1 text-sm text-muted-foreground">Pertanyaan</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Image className="w-4 h-4" />
                          <div className="text-xs text-gray-500">Klik untuk tambahkan gambar</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select value={q.type} onValueChange={v => updateQuestion(q.id, { type: v })}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Pilihan Ganda</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Textarea value={q.text} placeholder="Pertanyaan" onChange={e => updateQuestion(q.id, { text: e.target.value })} />
                    </div>

                    {q.type === "mcq" && (
                      <div className="mt-4 space-y-2">
                        {q.options.map(opt => (
                          <div key={opt.id} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`answer_${q.id}`}
                              checked={opt.correct}
                              onChange={() => setCorrectOption(q.id, opt.id)}
                              className="w-4 h-4"
                            />
                            <Input value={opt.text} onChange={e => updateQuestion(q.id, { options: q.options.map(o => (o.id === opt.id ? { ...o, text: e.target.value } : o)) })} />
                            <button onClick={() => removeOption(q.id, opt.id)} className="text-gray-400 p-2" title="Hapus opsi"><X className="w-4 h-4" /></button>
                          </div>
                        ))}

                        <button onClick={() => addOption(q.id)} className="text-sm text-[#0B4B6F] font-medium">Tambah Opsi</button>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button onClick={() => duplicateQuestion(q.id)} className="text-sm text-muted-foreground flex items-center gap-2"><Copy className="w-4 h-4" /> Duplikat</button>
                      <button onClick={() => removeQuestion(q.id)} className="text-sm text-red-600 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Hapus</button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white px-4 py-2 rounded shadow">
          <Button variant="outline" onClick={() => addQuestion("mcq")}><Plus className="w-4 h-4" /> Tambah Pilihan Ganda</Button>
          <Button variant="outline" onClick={() => addQuestion("essay")}><Plus className="w-4 h-4" /> Tambah Essay</Button>
        </div>
      </div>
    </GuruLayout>
  );
}
