import { useEffect, useRef, useState, useCallback } from 'react'
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const MAX_RECORDING_MS = 5 * 60 * 1000 // 5 minutes

interface AudioRecorderProps {
  /** Called when the user confirms a recorded audio file. */
  onComplete: (file: File) => void
  /** Disable all controls (e.g. while submitting). */
  disabled?: boolean
  /** Optional label shown on the confirm button. */
  confirmLabel?: string
}

type Status = 'idle' | 'recording' | 'recorded' | 'unsupported'

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${m}:${s}`
}

/**
 * Records audio from the browser microphone using the MediaRecorder API,
 * produces a File (webm/opus by default) and hands it to `onComplete`.
 */
export default function AudioRecorder({
  onComplete,
  disabled = false,
  confirmLabel = 'Anexar áudio',
}: AudioRecorderProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanupStream()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pick a supported mime type — memoized once (stable across renders)
  const mimeTypeRef = useRef('audio/webm')
  const pickMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return ''
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(c)) return c
      } catch {
        // ignore unsupported probe
      }
    }
    return ''
  }, [])
  // Probe once on mount so the value is ready before recording starts
  useEffect(() => {
    const m = pickMimeType()
    if (m) mimeTypeRef.current = m
  }, [pickMimeType])

  const handleStop = useCallback(() => {
    const recorder = mediaRecorderRef.current
    try {
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
    } catch (err) {
      console.error('Erro ao parar gravação:', err)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const handleStart = async () => {
    if (disabled) return

    // Abort early if the browser can't record at all (no MediaRecorder API).
    // Importante: esta verificação NÃO dispara o prompt de permissão, então pode
    // rodar no topo do handler sem consumir a user gesture.
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setStatus('unsupported')
      toast.error('Seu navegador não suporta gravação de áudio.')
      return
    }

    // Reset any leftover state before starting a fresh recording
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    chunksRef.current = []

    try {
      // CRÍTICO: navigator.mediaDevices.getUserMedia deve ser chamado DIRETAMENTE
      // dentro do handler de clique do usuário (user gesture), sem setTimeout,
      // sem await intermediário e sem callbacks aninhados que percam o contexto
      // da interação. O navegador exige isso para mostrar o prompt nativo
      // "site.com quer acessar seu microfone".
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = mimeTypeRef.current || pickMimeType() || 'audio/webm'

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setStatus('recorded')
        setElapsed(0)
        cleanupStream()
      }

      recorder.start()
      startTimeRef.current = Date.now()
      setElapsed(0)
      setStatus('recording')

      intervalRef.current = setInterval(() => {
        const e = Date.now() - startTimeRef.current
        setElapsed(e)
        if (e >= MAX_RECORDING_MS) {
          handleStop()
        }
      }, 250)
    } catch (err) {
      console.error('Erro ao iniciar gravação:', err)
      const name = (err as { name?: string })?.name
      if (
        name === 'NotAllowedError' ||
        name === 'SecurityError' ||
        name === 'PermissionDeniedError'
      ) {
        toast.error(
          'Permissão de microfone negada. Autorize o acesso nas configurações do navegador e tente novamente.',
        )
      } else if (
        name === 'NotFoundError' ||
        name === 'DevicesNotFoundError' ||
        name === 'OverconstrainedError'
      ) {
        toast.error('Nenhum microfone encontrado. Conecte um microfone e tente novamente.')
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        toast.error('O microfone está em uso por outro aplicativo. Feche-o e tente novamente.')
      } else if (name === 'AbortError') {
        toast.error('A gravação foi interrompida. Tente novamente.')
      } else {
        toast.error('Não foi possível acessar o microfone. Verifique as permissões.')
      }
      cleanupStream()
      setStatus('idle')
    }
  }

  const handleDiscard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setStatus('idle')
    setElapsed(0)
    chunksRef.current = []
  }

  const handleConfirm = () => {
    if (!audioUrl) return
    // Rebuild a File from the stored blob chunks
    const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' })
    const ext = mimeTypeRef.current.includes('mp4')
      ? 'm4a'
      : mimeTypeRef.current.includes('ogg')
        ? 'ogg'
        : 'webm'
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const file = new File([blob], `audio-${stamp}.${ext}`, {
      type: mimeTypeRef.current || 'audio/webm',
    })
    onComplete(file)
    // reset after handing off
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setStatus('idle')
    setElapsed(0)
  }

  if (status === 'unsupported') {
    return (
      <p className="text-[11px] text-slate-400">Gravação de áudio não suportada neste navegador.</p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {status === 'idle' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleStart}
          disabled={disabled}
          className="gap-1.5 text-xs"
        >
          <Mic className="h-3.5 w-3.5 text-indigo-600" />
          Gravar áudio
        </Button>
      )}

      {status === 'recording' && (
        <div className="flex items-center gap-2 p-2 rounded-xl border border-red-200 bg-red-50/50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs font-mono font-semibold text-red-600 tabular-nums">
            {formatMs(elapsed)}
          </span>
          <span className="text-[11px] text-red-500/80">Gravando...</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleStop}
            className="ml-auto h-7 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-100"
          >
            <Square className="h-3 w-3 fill-current" />
            Parar
          </Button>
        </div>
      )}

      {status === 'recorded' && audioUrl && (
        <div className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Mic className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600">Áudio gravado</span>
          </div>
          <audio src={audioUrl} controls className="w-full h-9" />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleDiscard}
              disabled={disabled}
              className="h-7 text-xs gap-1.5 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Descartar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={disabled}
              className="h-7 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {disabled ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
