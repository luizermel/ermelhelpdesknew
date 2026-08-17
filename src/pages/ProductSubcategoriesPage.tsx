import { ProductCategoriesTab } from '@/components/ProductCategoriesTab'

/**
 * Página dedicada de Subcategorias de Produtos (collection `product_subcategories`).
 * Renderiza apenas a seção de subcategorias, reaproveitando o componente de tabela.
 */
export default function ProductSubcategoriesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          🗂️ Subcategorias de Produtos
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cadastro de subcategorias vinculadas às categorias de produtos.
        </p>
      </div>
      <ProductCategoriesTab hideCategories />
    </div>
  )
}
