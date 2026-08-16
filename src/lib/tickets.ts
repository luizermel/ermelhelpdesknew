/**
 * Helpers for working with ticket attachments (images + audio).
 * Mirrors the original Lovable implementation in src/lib/tickets.ts.
 */

const AUDIO_EXTENSIONS = ['webm', 'mp3', 'ogg', 'wav', 'm4a', 'oga', 'opus']

/**
 * Returns true when the given filename/path/URL points to an audio file
 * based on its extension.
 */
export function isAudioPath(filename: string | undefined | null): boolean {
  if (!filename) return false
  const clean = filename.split('?')[0].split('#')[0]
  const dot = clean.lastIndexOf('.')
  if (dot < 0) return false
  const ext = clean.slice(dot + 1).toLowerCase()
  return AUDIO_EXTENSIONS.includes(ext)
}

export const AUDIO_MIME_TYPES = [
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

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const ATTACHMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, ...AUDIO_MIME_TYPES]

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB

export interface AttachmentValidation {
  valid: boolean
  error?: string
}

/**
 * Validates a single File to ensure it is an allowed attachment
 * (image or audio) within the size limit.
 */
export function validateAttachment(file: File): AttachmentValidation {
  const type = file.type.toLowerCase()
  const isAudio = AUDIO_MIME_TYPES.some((m) => type === m) || isAudioPath(file.name)
  const isImage = IMAGE_MIME_TYPES.some((m) => type === m)

  if (!isAudio && !isImage) {
    return {
      valid: false,
      error: `O arquivo "${file.name}" não é um anexo válido (imagens ou áudio).`,
    }
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: `O arquivo "${file.name}" excede o tamanho máximo permitido de 10MB.`,
    }
  }

  return { valid: true }
}
