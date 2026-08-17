import { useState, useMemo } from 'react'
import { productCategoriesService } from '@/services/api'
import type { ProductCategory } from '@/types'
import { ProductCategoriesTab } from '@/components/ProductCategoriesTab'

/**
 * Página dedicada de Categorias de Produtos (collection `product_categories`).
 * Renderiza apenas a seção de categorias, reaproveitando o componente de tabela.
 */
export default function ProductCategoriesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          🏷️ Categorias de Produtos
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cadastro de categorias utilizadas na classificação de produtos.
        </p>
      </div>
      <CategoriesOnly />
    </div>
  )
}

function CategoriesOnly() {
  const [, force] = useState(0)
  // O componente ProductCategoriesTab carrega categorias e subcategorias.
  // Aqui filtramos visualmente apenas a seção de categorias, ocultando subcategorias.
  void useMemo(() => force, [])
  return <ProductCategoriesTab hideSubcategories />
}
