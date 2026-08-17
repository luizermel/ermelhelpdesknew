import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Loader2, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { manufacturersService, suppliersService } from '@/services/api'
import type { Manufacturer, Supplier } from '@/types'
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

type SortField = 'name' | 'site' | 'contact' | 'phone'
type SortDir = 'asc' | 'desc'

interface PartnerForm {
  name: string
  site: string
  contact: string
  phone: string
}

const EMPTY: PartnerForm = { name: '', site: '', contact: '', phone: '' }

/**
 * Aba unificada de Fabricantes e Fornecedores.
 * Ambos seguem o mesmo padrão: tabela com CRUD (nome, site, contato, telefone),
 * ordenação por clique no cabeçalho e A-Z.
 */
export function PartnerSection({
  title,
  icon,
  service,
}: {
  title: string
  icon: React.ReactNode
  service: {
    getAll: () => Promise<(Manufacturer | Supplier)[]>
    create: (data: Partial<Manufacturer | Supplier>) => Promise<any>
    update: (id: string, data: Partial<Manufacturer | Supplier>) => Promise<any>
    remove: (id: string) => Promise<void>
  }
}) {
  const [rows, setRows] = useState<(Manufacturer | Supplier)[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: 'name',
    dir: 'asc',
  })

  const [dialog, setDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<(Manufacturer | Supplier) | null>(null)
  const [form, setForm] = useState<PartnerForm>(EMPTY)

  const load = async () => {
    setLoading(true)
    try {
      setRows(await service.getAll())
    } catch (err) {
      console.error(err)
      toast.error(`Erro ao carregar ${title.toLowerCase()}.`)
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
    return [...filtered].sort((a, b) => {
      const av = (a[sort.field] || '').toString()
      const bv = (b[sort.field] || '').toString()
      return av.localeCompare(bv) * dir
    })
  }, [rows, search, sort])

  const toggleSort = (field: SortField) =>
    setSort((s) => ({
      field,
      dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc',
    }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setDialog(true)
  }
  const openEdit = (r: Manufacturer | Supplier) => {
    setEditing(r)
    setForm({
      name: r.name || '',
      site: r.site || '',
      contact: r.contact || '',
      phone: r.phone || '',
    })
    setDialog(true)
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('O nome é obrigatório.')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        site: form.site.trim() || undefined,
        contact: form.contact.trim() || undefined,
        phone: form.phone.trim() || undefined,
      }
      if (editing) {
        await service.update(editing.id, payload)
        toast.success(`${title} atualizado!`)
      } else {
        await service.create(payload)
        toast.success(`${title} cadastrado!`)
      }
      setDialog(false)
      load()
    } catch (err) {
      console.error(err)
      toast.error(`Erro ao salvar ${title.toLowerCase()}.`)
    } finally {
      setSaving(false)
    }
  }
  const remove = async (r: Manufacturer | Supplier) => {
    if (!confirm(`Excluir "${r.name}"?`)) return
    try {
      await service.remove(r.id)
      toast.success(`${title} excluído.`)
      load()
    } catch (err) {
      console.error(err)
      toast.error(`Erro ao excluir ${title.toLowerCase()}.`)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sort.field !== field ? (
      <ArrowUp className="h-3 w-3 text-slate-300 inline ml-1" />
    ) : sort.dir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-indigo-600 inline ml-1" />
    )

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          {icon} {title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Buscar ${title.toLowerCase()}...`}
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
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>
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
                    onClick={() => toggleSort('name')}
                  >
                    Nome <SortIcon field="name" />
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('site')}
                  >
                    Site <SortIcon field="site" />
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('contact')}
                  >
                    Contato <SortIcon field="contact" />
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer select-none hover:text-indigo-600"
                    onClick={() => toggleSort('phone')}
                  >
                    Telefone <SortIcon field="phone" />
                  </th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhum registro cadastrado.
                    </td>
                  </tr>
                ) : (
                  sorted.map((r) => (
                    <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600">
                        {r.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {r.site ? (
                          <a
                            href={r.site.startsWith('http') ? r.site : `https://${r.site}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            {r.site}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{r.contact || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">{r.phone || '—'}</td>
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

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar ${title}` : `Novo ${title}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="h-9"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Site</label>
                <Input
                  placeholder="https://..."
                  value={form.site}
                  onChange={(e) => setForm({ ...form, site: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Telefone</label>
                <Input
                  placeholder="(00) 0000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Contato</label>
              <Input
                placeholder="Nome do contato / e-mail"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="h-9"
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
    </section>
  )
}

export function ManufacturersAndSuppliersTab() {
  return (
    <div className="space-y-8">
      <PartnerSection
        title="Fabricantes"
        icon={<span className="text-indigo-600">🏭</span>}
        service={manufacturersService}
      />
      <PartnerSection
        title="Fornecedores"
        icon={<span className="text-indigo-600">🚚</span>}
        service={suppliersService}
      />
    </div>
  )
}

export default ManufacturersAndSuppliersTab
