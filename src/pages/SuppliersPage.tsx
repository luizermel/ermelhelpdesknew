import { manufacturersService, suppliersService } from '@/services/api'
import { PartnerSection } from '@/components/ManufacturersAndSuppliersTab'

export default function SuppliersPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-indigo-600">🚚</span> Fornecedores
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cadastro de fornecedores dos produtos do estoque.
        </p>
      </div>
      <PartnerSection
        title="Fornecedores"
        icon={<span className="text-indigo-600">🚚</span>}
        service={suppliersService}
      />
    </div>
  )
}
