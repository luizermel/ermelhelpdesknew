import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import type { Product } from '@/types'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProductAutocompleteProps {
  products: Product[]
  value: string
  onChange: (productId: string) => void
  placeholder?: string
}

/**
 * Combobox de produtos com busca por nome/código de barras.
 * Substitui o Select nativo para permitir digitação e filtragem rápida.
 */
export function ProductAutocomplete({
  products,
  value,
  onChange,
  placeholder = 'Buscar produto...',
}: ProductAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(() => products.find((p) => p.id === value) || null, [products, value])

  // Mantém o input exibindo o nome do produto selecionado quando fechado
  useEffect(() => {
    if (!open) {
      setQuery(selected ? selected.name : '')
    }
  }, [selected, open])

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.expand?.category?.name || '').toLowerCase().includes(q) ||
        (p.expand?.manufacturer?.name || '').toLowerCase().includes(q),
    )
  }, [products, query])

  const select = (id: string) => {
    onChange(id)
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = filtered[highlight]
      if (target) select(target.id)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      <Input
        ref={inputRef}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={() => {
          setOpen(true)
          setHighlight(0)
        }}
        onKeyDown={handleKeyDown}
        className="h-9 text-xs pl-8 pr-7"
      />
      <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />

      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-400 text-center">
              Nenhum produto encontrado.
            </p>
          ) : (
            filtered.map((p, idx) => (
              <button
                type="button"
                key={p.id}
                onClick={() => select(p.id)}
                onMouseEnter={() => setHighlight(idx)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 border-b border-slate-50 last:border-0',
                  idx === highlight ? 'bg-indigo-50' : 'hover:bg-slate-50',
                )}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {p.expand?.category?.name || '—'}
                    {p.expand?.manufacturer?.name ? ` • ${p.expand?.manufacturer?.name}` : ''}
                    {p.barcode ? ` • ${p.barcode}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.is_it_asset && (
                    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px]">
                      TI
                    </Badge>
                  )}
                  {p.is_patrimony && (
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px]">
                      Patrim.
                    </Badge>
                  )}
                  {p.is_serial && (
                    <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px]">
                      Serial
                    </Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ProductAutocomplete
