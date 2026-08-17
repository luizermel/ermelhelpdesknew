import { manufacturersService } from '@/services/api'
import { PartnerSection } from '@/components/ManufacturersAndSuppliersTab'

/**
 * Página dedicada de Fabricantes (collection `manufacturers`).
 * Reaproveita a PartnerSection usada na aba unificada.
 */
export default function ManufacturersPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-indigo-600">🏭</span> Fabricantes
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cadastro de fabricantes dos produtos do estoque.
        </p>
      </div>
      <PartnerSection
        title="Fabricantes"
        icon={<span className="text-indigo-600">🏭</span>}
        service={manufacturersService}
      />
    </div>
  )
}
