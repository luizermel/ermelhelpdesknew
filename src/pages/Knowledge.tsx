import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  BookOpen,
  Search,
  FileText,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Paperclip,
  Download,
  Globe,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { knowledgeService, getFileUrl } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import { useViewMode } from '@/hooks/use-view-mode'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import type { KnowledgeArticle, KnowledgeVisibility, Company } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export default function Knowledge() {
  const { isAdmin, user } = useAuth()
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [openArticle, setOpenArticle] = useState<KnowledgeArticle | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null)
  const [saving, setSaving] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formVisibility, setFormVisibility] = useState<KnowledgeVisibility>('GERAL')
  const [formCompany, setFormCompany] = useState('')
  const [formFiles, setFormFiles] = useState<File[]>([])
  const [companies, setCompanies] = useState<Company[]>([])

  // View mode state (persisted em localStorage) — padrão Lista
  const { viewMode, toggleViewMode } = useViewMode('knowledge-view-mode')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetch = useCallback(async () => {
    try {
      const data = await knowledgeService.getAll()
      setArticles(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar artigos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    // carrega empresas para o select de visibilidade
    pb.collection('companies')
      .getFullList<Company>({ sort: 'name' })
      .then(setCompanies)
      .catch(() => undefined)
  }, [fetch])

  useRealtime<KnowledgeArticle>('knowledge_articles', () => {
    fetch()
  })

  // Filtragem por visibilidade: GERAL todos veem; "Por empresa" só mesma empresa do autor
  const visibleArticles = useMemo(() => {
    if (!user) return []
    return articles.filter((a) => {
      if (a.visibility !== 'Por empresa') return true
      // mesmo empresa do autor
      const authorCompany = a.company || a.expand?.company?.id
      return !!authorCompany && authorCompany === user.company
    })
  }, [articles, user])

  const filtered = useMemo(() => {
    if (!search.trim()) return visibleArticles
    const q = search.toLowerCase()
    return visibleArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q),
    )
  }, [visibleArticles, search])

  const categories = useMemo(() => {
    const set = new Set<string>()
    visibleArticles.forEach((a) => a.category && set.add(a.category))
    return Array.from(set).sort()
  }, [visibleArticles])

  const openCreate = () => {
    setEditing(null)
    setFormTitle('')
    setFormContent('')
    setFormCategory('')
    setFormVisibility('GERAL')
    setFormCompany('')
    setFormFiles([])
    setEditOpen(true)
  }

  const openEdit = (a: KnowledgeArticle) => {
    setEditing(a)
    setFormTitle(a.title)
    setFormContent(a.content)
    setFormCategory(a.category || '')
    setFormVisibility(a.visibility || 'GERAL')
    setFormCompany(a.company || '')
    setFormFiles([])
    setEditOpen(true)
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    setFormFiles((prev) => [...prev, ...Array.from(files)].slice(0, 10))
  }

  const removeFormFile = (index: number) => {
    setFormFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Informe o título.')
      return
    }
    if (formVisibility === 'Por empresa' && !formCompany) {
      toast.error('Selecione a empresa para a visibilidade "Por empresa".')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', formTitle.trim())
      formData.append('content', formContent)
      formData.append('category', formCategory.trim())
      formData.append('visibility', formVisibility)
      formData.append('company', formVisibility === 'Por empresa' ? formCompany : '')
      formFiles.forEach((f) => formData.append('attachments', f))

      if (editing) {
        await knowledgeService.update(editing.id, formData)
        toast.success('Artigo atualizado!')
      } else {
        await knowledgeService.create(formData)
        toast.success('Artigo publicado!')
      }
      setEditOpen(false)
      fetch()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar artigo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (a: KnowledgeArticle) => {
    if (!confirm(`Remover o artigo "${a.title}"?`)) return
    try {
      await knowledgeService.remove(a.id)
      toast.success('Artigo removido.')
      fetch()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover artigo.')
    }
  }

  const downloadAttachment = (article: KnowledgeArticle, filename: string) => {
    const url = getFileUrl(article, filename)
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Base de Conhecimento
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Consulte artigos e tutoriais para resolver problemas comuns rapidamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />
          {isAdmin && (
            <Button
              onClick={openCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Artigo
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Buscar artigo por título, categoria ou conteúdo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={search === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearch('')}
            className={
              search === ''
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs'
                : 'h-7 text-xs'
            }
          >
            Todos
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              variant={search === c ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearch(search === c ? '' : c)}
              className={
                search === c
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs'
                  : 'h-7 text-xs'
              }
            >
              {c}
            </Button>
          ))}
        </div>
      )}

      {/* Grid / Lista */}
      {loading ? (
        viewMode === 'list' ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          Nenhum artigo encontrado.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
              onClick={() => setOpenArticle(a)}
            >
              <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                  {a.title}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {a.content.replace(/<[^>]+>/g, '')}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                {a.visibility === 'Por empresa' ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-50 text-amber-700 border-amber-100"
                  >
                    <Building2 className="h-2.5 w-2.5 mr-0.5" />
                    Por empresa
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100"
                  >
                    <Globe className="h-2.5 w-2.5 mr-0.5" />
                    Geral
                  </Badge>
                )}
                {a.category && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100"
                  >
                    {a.category}
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
                  new Date(a.created),
                )}
              </span>
              {isAdmin && (
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <Card
              key={a.id}
              className="bg-white border-slate-200/90 shadow-2xs rounded-2xl hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
              onClick={() => setOpenArticle(a)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <FileText className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {a.visibility === 'Por empresa' ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-amber-50 text-amber-700 border-amber-100"
                      >
                        <Building2 className="h-2.5 w-2.5 mr-0.5" />
                        Por empresa
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100"
                      >
                        <Globe className="h-2.5 w-2.5 mr-0.5" />
                        Geral
                      </Badge>
                    )}
                    {a.category && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100"
                      >
                        {a.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900 leading-snug mt-1 group-hover:text-indigo-700">
                  {a.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-slate-500 line-clamp-3">
                  {a.content.replace(/<[^>]+>/g, '')}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
                      new Date(a.created),
                    )}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(a)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View modal */}
      <Dialog open={!!openArticle} onOpenChange={(o) => !o && setOpenArticle(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl max-h-[85vh] overflow-y-auto">
          {openArticle && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    {openArticle.title}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-slate-400"
                    onClick={() => setOpenArticle(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {openArticle.category && (
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-100"
                    >
                      {openArticle.category}
                    </Badge>
                  )}
                  {openArticle.visibility === 'Por empresa' ? (
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-amber-50 text-amber-700 border-amber-100"
                    >
                      <Building2 className="h-2.5 w-2.5 mr-0.5" />
                      Por empresa
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-100"
                    >
                      <Globe className="h-2.5 w-2.5 mr-0.5" />
                      Geral
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-slate-400">
                  Publicado em{' '}
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                    new Date(openArticle.created),
                  )}
                </DialogDescription>
              </DialogHeader>
              <div
                className="prose prose-sm max-w-none text-slate-700 [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mb-2 [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: openArticle.content }}
              />

              {/* Anexos */}
              {openArticle.attachments && openArticle.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Arquivos anexados ({openArticle.attachments.length})
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {openArticle.attachments.map((file) => (
                      <li key={file}>
                        <button
                          type="button"
                          onClick={() => downloadAttachment(openArticle, file)}
                          className="w-full flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 truncate flex-1">
                            {file}
                          </span>
                          <Download className="h-4 w-4 text-indigo-600 shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create modal */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Artigo' : 'Novo Artigo'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Preencha as informações do artigo da base de conhecimento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Título *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Como configurar VPN corporativa"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Categoria</Label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Ex: Rede, E-mail, Software"
              />
            </div>

            {/* Visibilidade + Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Visibilidade *</Label>
                <Select
                  value={formVisibility}
                  onValueChange={(v) => setFormVisibility(v as KnowledgeVisibility)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GERAL">Geral (todos veem)</SelectItem>
                    <SelectItem value="Por empresa">Por empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formVisibility === 'Por empresa' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Empresa do autor *</Label>
                  <Select value={formCompany} onValueChange={setFormCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Conteúdo (HTML)</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                placeholder="<h3>Título</h3><p>Conteúdo do artigo...</p>"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Você pode usar tags HTML básicas (h3, p, strong, ul, li).
              </p>
            </div>

            {/* Upload de arquivos */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Anexar arquivos (opcional)
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleFileSelect(e.dataTransfer.files)
                }}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <Paperclip className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
                <p className="text-xs font-medium text-slate-700">
                  Clique para selecionar ou arraste arquivos
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Até 10 anexos (máx 10MB cada)</p>
              </div>

              {/* Novos arquivos selecionados */}
              {formFiles.length > 0 && (
                <ul className="space-y-1">
                  {formFiles.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <FileText className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span className="text-[11px] text-slate-700 truncate flex-1">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFormFile(idx)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Anexos já existentes (em edição) */}
              {editing && editing.attachments && editing.attachments.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-500 mt-1 mb-1">Anexos atuais:</p>
                  <ul className="space-y-1">
                    {editing.attachments.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-100 bg-slate-50"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="text-[11px] text-slate-600 truncate flex-1">{f}</span>
                        <button
                          type="button"
                          onClick={() => downloadAttachment(editing, f)}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="Baixar"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar' : 'Publicar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
