import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { BookOpen, Search, FileText, Loader2, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { knowledgeService } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import type { KnowledgeArticle } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function Knowledge() {
  const { isAdmin } = useAuth()
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
  }, [fetch])

  useRealtime<KnowledgeArticle>('knowledge_articles', () => {
    fetch()
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return articles
    const q = search.toLowerCase()
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q),
    )
  }, [articles, search])

  const categories = useMemo(() => {
    const set = new Set<string>()
    articles.forEach((a) => a.category && set.add(a.category))
    return Array.from(set).sort()
  }, [articles])

  const openCreate = () => {
    setEditing(null)
    setFormTitle('')
    setFormContent('')
    setFormCategory('')
    setEditOpen(true)
  }

  const openEdit = (a: KnowledgeArticle) => {
    setEditing(a)
    setFormTitle(a.title)
    setFormContent(a.content)
    setFormCategory(a.category || '')
    setEditOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error('Informe o título.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await knowledgeService.update(editing.id, {
          title: formTitle.trim(),
          content: formContent,
          category: formCategory.trim(),
        })
        toast.success('Artigo atualizado!')
      } else {
        await knowledgeService.create({
          title: formTitle.trim(),
          content: formContent,
          category: formCategory.trim(),
        })
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          Nenhum artigo encontrado.
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
                  {a.category && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100"
                    >
                      {a.category}
                    </Badge>
                  )}
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
                {openArticle.category && (
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-100 w-fit"
                  >
                    {openArticle.category}
                  </Badge>
                )}
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
