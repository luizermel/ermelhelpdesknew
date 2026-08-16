import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Zap, Plus, Pencil, Trash2, Copy, Loader2, Search, Tag } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { quickRepliesService } from '@/services/api'
import useRealtime from '@/hooks/use-realtime'
import type { QuickReply } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

export default function QuickReplies() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<QuickReply | null>(null)
  const [saving, setSaving] = useState(false)

  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState('')

  const fetch = useCallback(async () => {
    try {
      const data = await quickRepliesService.getAll()
      setReplies(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar respostas rápidas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  useRealtime<QuickReply>('quick_replies', () => {
    fetch()
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return replies
    const q = search.toLowerCase()
    return replies.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q),
    )
  }, [replies, search])

  const handleCopy = async (r: QuickReply) => {
    try {
      await navigator.clipboard.writeText(r.content)
      toast.success('Texto copiado para a área de transferência!')
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormTitle('')
    setFormContent('')
    setFormCategory('')
    setEditOpen(true)
  }

  const openEdit = (r: QuickReply) => {
    setEditing(r)
    setFormTitle(r.title)
    setFormContent(r.content)
    setFormCategory(r.category || '')
    setEditOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Preencha título e conteúdo.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory.trim(),
        created_by: user?.id,
      }
      if (editing) {
        await quickRepliesService.update(editing.id, payload)
        toast.success('Resposta atualizada!')
      } else {
        await quickRepliesService.create(payload)
        toast.success('Resposta criada!')
      }
      setEditOpen(false)
      fetch()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar resposta.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (r: QuickReply) => {
    if (!confirm(`Remover a resposta "${r.title}"?`)) return
    try {
      await quickRepliesService.remove(r.id)
      toast.success('Resposta removida.')
      fetch()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao remover resposta.')
    }
  }

  const canEdit = (r: QuickReply) => isAdmin || r.created_by === user?.id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Respostas Rápidas
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Templates prontos para copiar e acelerar o atendimento dos chamados
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Resposta
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Buscar resposta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Zap className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          Nenhuma resposta rápida cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Card
              key={r.id}
              className="bg-white border-slate-200/90 shadow-2xs rounded-2xl hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col"
            >
              <CardContent
                className="p-4 flex-1 flex flex-col cursor-pointer"
                onClick={() => handleCopy(r)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-700">
                    {r.title}
                  </h3>
                  {r.category && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100 shrink-0"
                    >
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {r.category}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-4 flex-1">{r.content}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-indigo-600 font-medium inline-flex items-center gap-1">
                    <Copy className="h-3 w-3" />
                    Clique para copiar
                  </span>
                  {canEdit(r) && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(r)}
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

      {/* Edit/Create modal */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-w-xl bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editing ? 'Editar Resposta' : 'Nova Resposta Rápida'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Crie um template reutilizável para acelerar o atendimento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Título *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Confirmação de recebimento"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Categoria (opcional)</Label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Ex: Triagem, Fechamento, Acesso"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Texto da resposta *</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                placeholder="Digite o texto que será copiado..."
                required
              />
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
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
