import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Loader2, Search, ArrowUp, ArrowDown, Tag } from 'lucide-react'
import { brandsService } from '@/services/api'
import type { Brand } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type SortDir = 'asc' | 'desc'

/**
 * Cadastro de Marcas (collection `brands`).
 * Tabela simples com CRUD, busca e ordenação por nome (A-Z).
 */
export default function BrandsPage() {
  const [rows, setRows] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ dir: SortDir }>({ dir: 'asc' })

  const [dialog, setDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [name, setName] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setRows(await brandsService.getAll())
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar marcas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = useMemo(() => {
    const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name) * dir)
  }, [rows, search, sort])

  const toggleSort = () => setSort((s) => ({ dir: s.dir === 'asc' ? 'desc' : 'asc' }))

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDialog(true)
  }
  const openEdit = (r: Brand) => {
    setEditing(r)
    setName(r.name)
    setDialog(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('O nome é obrigatório.')
    setSaving(true)
    try {
      if (editing) {
        await brandsService.update(editing.id, { name: name.trim() })
        toast.success('Marca atualizada!')
      } else {
        await brandsService.create({ name: name.trim() })
        toast.success('Marca cadastrada!')
      }
      setDialog(false)
      load()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar marca.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (r: Brand) => {
    if (!confirm(`Excluir a marca "${r.name}"?`)) return
    try {
      await brandsService.remove(r.id)
      toast.success('Marca excluída.')
      load()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir marca.')
    }
  }

  const SortIcon = () =>
    sort.dir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-600 inline ml-1" />
    )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-indigo-600" />
            Marcas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cadastro de marcas de produtos utilizadas no estoque.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
          <Button
            onClick={openCreate}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" /> Nova Marca
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th
                      className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                      onClick={toggleSort}
                    >
                      Nome <SortIcon />
                    </th>
                    <th className="py-3 px-4">Criada em</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Nenhuma marca cadastrada.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((r) => (
                      <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600">
                          {r.name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {r.created
                            ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
                                new Date(r.created),
                              )
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(r)}
                              className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(r)}
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Marca' : 'Nova Marca'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
