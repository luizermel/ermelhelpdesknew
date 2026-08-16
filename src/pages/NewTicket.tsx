import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  X,
  FileImage,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Building2,
  ShieldAlert,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import {
  sectorsService,
  subcategoriesService,
  ticketsService,
  messagesService,
} from '@/services/api'
import type { Sector, Subcategory, TicketCategory, TicketPriority } from '@/types'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import AudioRecorder from '@/components/AudioRecorder'
import { isAudioPath, validateAttachment } from '@/lib/tickets'
import { FileAudio } from 'lucide-react'

const CATEGORIES: TicketCategory[] = [
  'Hardware',
  'Software',
  'Rede',
  'Acesso e Senha',
  'E-mail',
  'Impressora',
  'Telefonia',
  'Outros',
]

const PRIORITIES: { value: TicketPriority; label: string; desc: string }[] = [
  { value: 'Baixa', label: 'Baixa', desc: 'Dúvidas, melhorias ou equipamentos secundários' },
  {
    value: 'Média',
    label: 'Média (Padrão)',
    desc: 'Impacta o trabalho individual de forma parcial',
  },
  { value: 'Alta', label: 'Alta / Urgente', desc: 'Paralisação total das atividades ou setor' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
]

interface FilePreview {
  file: File
  previewUrl: string
}

export default function NewTicket() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [sectors, setSectors] = useState<Sector[]>([])
  const [loadingSectors, setLoadingSectors] = useState(true)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [subcategory, setSubcategory] = useState('')

  // Form Fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory>('Hardware')
  const [sector, setSector] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('Média')
  const [attachments, setAttachments] = useState<FilePreview[]>([])

  const [loading, setLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    sectorsService
      .getAll()
      .then((data) => {
        setSectors(data)
        // Setor travado com o setor do usuário logado
        if (user?.sector) {
          setSector(user.sector)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingSectors(false))

    // Carrega subcategorias
    subcategoriesService
      .getAll()
      .then(setSubcategories)
      .catch((err) => console.error(err))

    // Mantém inscrito em alterações de subcategorias em tempo real
    const unsub = pb.collection('subcategories').subscribe('*', () => {
      subcategoriesService
        .getAll()
        .then(setSubcategories)
        .catch(() => undefined)
    })
    return () => {
      unsub.then((u) => u())
    }
  }, [user?.sector])

  // Subcategorias filtradas pela categoria selecionada
  const filteredSubcategories = subcategories.filter((s) => s.category_id === category)

  // Quando a categoria muda, limpa a subcategoria
  useEffect(() => {
    setSubcategory('')
  }, [category])

  const handleFileSelect = (files: FileList | null) => {
    setFileError(null)
    if (!files) return

    const newPreviews: FilePreview[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const v = validateAttachment(file)
      if (!v.valid) {
        if (v.error) setFileError(v.error)
        continue
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type) && !isAudioPath(file.name)) {
        setFileError(`O arquivo "${file.name}" não é um anexo válido (imagens ou áudio).`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`O arquivo "${file.name}" excede o tamanho máximo permitido de 10MB.`)
        continue
      }

      const previewUrl = URL.createObjectURL(file)
      newPreviews.push({ file, previewUrl })
    }

    setAttachments((prev) => [...prev, ...newPreviews].slice(0, 10))
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const validate = () => {
    const errors: Record<string, string> = {}

    if (!title.trim()) {
      errors.title = 'O título do chamado é obrigatório.'
    } else if (title.trim().length > 200) {
      errors.title = 'O título não pode ter mais de 200 caracteres.'
    }

    if (!description.trim()) {
      errors.description = 'A descrição detalhada é obrigatória.'
    }

    if (!category) {
      errors.category = 'Selecione uma categoria.'
    }

    if (!sector) {
      errors.sector = 'Selecione o setor impactado.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!validate() || !user) return

    setLoading(true)

    try {
      // Use FormData to support files
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('category', category)
      if (subcategory) formData.append('subcategory', subcategory)
      formData.append('sector', sector)
      formData.append('priority', priority)
      formData.append('status', 'Aberto')
      formData.append('requester', user.id)

      // Add attachments
      attachments.forEach((att) => {
        formData.append('attachments', att.file)
      })

      const newTicket = await ticketsService.create(formData)

      // Automatically create opening message on ticket_messages
      await messagesService.create({
        ticket: newTicket.id,
        author: user.id,
        content: description.trim(),
        event_type: 'comentario',
      })

      toast.success('Chamado aberto com sucesso!', {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      })

      navigate(`/chamados/${newTicket.id}`)
    } catch (err: unknown) {
      console.error(err)
      setFormError('Erro ao abrir chamado. Verifique as informações e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-600 hover:text-slate-900 -ml-2 mb-2"
        >
          <Link to="/chamados" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para chamados</span>
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Abrir Novo Chamado
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Descreva detalhadamente o problema para que a equipe de TI possa atender com agilidade
        </p>
      </div>

      <Card className="bg-white border-slate-200/90 shadow-sm rounded-2xl">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">Formulário de Abertura</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Preencha os campos abaixo com as informações do incidente ou solicitação
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{formError}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
                Título resumido do chamado <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Notebook não liga após atualização / Sem internet na sala de reuniões"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' })
                }}
                maxLength={200}
                className={fieldErrors.title ? 'border-red-500 focus-visible:ring-red-400' : ''}
                disabled={loading}
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.title}</p>
              )}
            </div>

            {/* Three Column Row: Category, Subcategory and Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                  Categoria do problema <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as TicketCategory)}
                  disabled={loading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.category && (
                  <p className="text-[11px] text-red-500 font-medium">{fieldErrors.category}</p>
                )}
              </div>

              {/* Subcategory */}
              <div className="space-y-1.5">
                <Label htmlFor="subcategory" className="text-xs font-semibold text-slate-700">
                  Subcategoria
                </Label>
                <Select
                  value={subcategory}
                  onValueChange={setSubcategory}
                  disabled={loading || filteredSubcategories.length === 0}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue
                      placeholder={
                        filteredSubcategories.length === 0
                          ? 'Sem subcategorias'
                          : 'Selecione a subcategoria'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">Filtrada pela categoria selecionada</p>
              </div>

              {/* Sector — travado com o setor do usuário logado */}
              <div className="space-y-1.5">
                <Label htmlFor="sector" className="text-xs font-semibold text-slate-700">
                  Setor do atendimento <span className="text-red-500">*</span>
                </Label>
                <Select value={sector} disabled>
                  <SelectTrigger id="sector">
                    <SelectValue
                      placeholder={loadingSectors ? 'Carregando setores...' : 'Selecione o setor'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Setor definido pelo seu perfil
                </p>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Prioridade da solicitação
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      priority === p.value
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{p.label}</span>
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          p.value === 'Alta'
                            ? 'bg-red-500'
                            : p.value === 'Média'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
                Descrição detalhada <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva o que aconteceu, mensagens de erro exibidas, testes já realizados ou o que você precisa que seja feito..."
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: '' })
                }}
                className={`resize-y ${fieldErrors.description ? 'border-red-500 focus-visible:ring-red-400' : ''}`}
                disabled={loading}
              />
              {fieldErrors.description && (
                <p className="text-[11px] text-red-500 font-medium">{fieldErrors.description}</p>
              )}
            </div>

            {/* Image Attachments Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">
                  Anexar imagens ou capturas de tela (opcional)
                </Label>
                <span className="text-[11px] text-slate-400">Até 10 anexos (máx 10MB cada)</span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleFileSelect(e.dataTransfer.files)
                }}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/ogg,audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/m4a"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className="mx-auto h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">
                  Clique para selecionar imagens ou arraste para cá
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Imagens: JPG, PNG, WEBP, GIF. Para áudio, use o gravador abaixo.
                </p>
              </div>

              {fileError && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {fileError}
                </p>
              )}

              {/* Attachments Preview Grid */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {attachments.map((att, idx) => {
                    const isAudio = isAudioPath(att.file.name) || att.file.type.startsWith('audio/')
                    return (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center"
                      >
                        {isAudio ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2">
                            <FileAudio className="h-6 w-6 text-indigo-600" />
                            <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                              {att.file.name}
                            </span>
                            <audio
                              src={att.previewUrl}
                              controls
                              className="w-full h-6"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <img
                            src={att.previewUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Remover anexo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {!isAudio && (
                          <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[10px] text-white px-1.5 py-0.5 truncate">
                            {att.file.name}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Audio Recorder */}
              <div className="pt-2">
                <Label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Gravar áudio (opcional)
                </Label>
                <AudioRecorder
                  disabled={loading}
                  onComplete={(file) => {
                    const v = validateAttachment(file)
                    if (!v.valid) {
                      if (v.error) setFileError(v.error)
                      return
                    }
                    const previewUrl = URL.createObjectURL(file)
                    setAttachments((prev) => [...prev, { file, previewUrl }].slice(0, 10))
                    toast.success('Áudio anexado.')
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/chamados')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando chamado...
                  </>
                ) : (
                  'Abrir Chamado'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
