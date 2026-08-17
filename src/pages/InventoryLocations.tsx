import { useState, useEffect } from 'react'
import { MapPin, Plus, Building2, Pencil, Trash2, Loader2, Search, Package } from 'lucide-react'
import { inventoryLocationsService } from '@/services/api'
import { useViewMode } from '@/hooks/use-view-mode'
import { ViewModeToggle } from '@/components/ViewModeToggle'
import { InventoryLocation } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function InventoryLocationsPage() {
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingLoc, setEditingLoc] = useState<InventoryLocation | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
  })

  // View mode state (persisted em localStorage) — padrão Lista
  const { viewMode, toggleViewMode } = useViewMode('inventory-locations-view-mode')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await inventoryLocationsService.getAll()
      setLocations(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar localizações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingLoc(null)
    setForm({ name: '', description: '' })
    setDialogOpen(true)
  }

  const handleOpenEdit = (loc: InventoryLocation) => {
    setEditingLoc(loc)
    setForm({
      name: loc.name || '',
      description: loc.description || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('O nome da localização é obrigatório.')
      return
    }

    setSaving(true)
    try {
      if (editingLoc) {
        await inventoryLocationsService.update(editingLoc.id, form)
        toast.success('Localização atualizada com sucesso!')
      } else {
        await inventoryLocationsService.create(form)
        toast.success('Localização cadastrada com sucesso!')
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar localização.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (loc: InventoryLocation) => {
    if (!confirm(`Tem certeza que deseja excluir o depósito "${loc.name}"?`)) return
    try {
      await inventoryLocationsService.remove(loc.id)
      toast.success('Localização excluída.')
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir localização.')
    }
  }

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      (loc.description && loc.description.toLowerCase().includes(search.toLowerCase())),
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-indigo-600" />
            Localizações / Depósitos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cadastre os depósitos físicos, galpões e locais de armazenamento dos materiais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle viewMode={viewMode} onToggle={toggleViewMode} />
          <Button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nova Localização
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="bg-white border-slate-200/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou descrição do depósito..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredLocations.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-slate-50/50">
          <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Nenhuma localização encontrada</p>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre o primeiro depósito para organizar o seu estoque.
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-indigo-50/30 transition-colors group"
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                  {loc.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {loc.description || 'Sem descrição informada.'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(loc)}
                  className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(loc)}
                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => (
            <Card
              key={loc.id}
              className="bg-white border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 pr-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                    {loc.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(loc)}
                    className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(loc)}
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-3 pb-4 space-y-2 flex-1 text-xs text-slate-600">
                {loc.description ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{loc.description}</p>
                ) : (
                  <p className="text-slate-400 italic">Sem descrição informada.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <MapPin className="h-5 w-5 text-indigo-600" />
              {editingLoc ? 'Editar Localização' : 'Nova Localização / Depósito'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nome do Depósito / Local *</label>
              <Input
                placeholder="Ex: Depósito Externo 1, Almoxarifado Sede"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Descrição / Endereço / Detalhes
              </label>
              <Textarea
                placeholder="Detalhes adicionais do local, andar, responsável..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Localização'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
