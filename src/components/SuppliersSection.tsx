import React, { useState } from 'react';
import { SupplierItem } from '../types';
import { 
  Truck, 
  Search, 
  ExternalLink, 
  Globe, 
  Star,
  PackageCheck
} from 'lucide-react';

interface SuppliersSectionProps {
  suppliers: SupplierItem[];
}

const CATEGORIES = [
  'Todos',
  'Herramientas',
  'Plomería',
  'Cerrajería',
  'Pinturas',
  'Construcción',
  'Electricidad'
];

export const SuppliersSection: React.FC<SuppliersSectionProps> = ({ suppliers }) => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = suppliers.filter((sup) => {
    const matchesCategory = 
      selectedCategory === 'Todos' || 
      sup.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = 
      sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.popularProducts.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E293B] via-slate-900 to-slate-800 text-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-700 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
            <Truck className="w-3.5 h-3.5 text-white" />
            <span>Directorio Oficial de Marcas y Proveedores</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Enlaces a Portales de Marcas Aliadas
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Accede de forma rápida a los sitios oficiales, portales B2B de pedidos para distribuidores, fichas técnicas y contactos comerciales de nuestras marcas socias.
          </p>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar proveedor por nombre (Truper, Dewalt, Rotoplas)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0f03f9] focus:ring-1 focus:ring-[#0f03f9]"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500 self-end sm:self-auto">
            {filteredSuppliers.length} marcas aliadas
          </span>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0f03f9] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((sup) => (
          <div
            key={sup.id}
            className={`bg-white rounded-xl border transition-all duration-300 hover:shadow-md hover:border-blue-200 flex flex-col justify-between overflow-hidden relative ${
              sup.isFeatured ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200'
            }`}
          >
            {/* Top Badge */}
            {sup.isFeatured && (
              <div className="absolute top-3 right-3 z-10 bg-[#0f03f9] text-white text-[10px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                <Star className="w-3 h-3 fill-white" />
                <span>Socio Estratégico</span>
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  {sup.logoUrl ? (
                    <img
                      src={sup.logoUrl}
                      alt={sup.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-black text-slate-400 text-sm">{sup.name.slice(0, 3).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#0f03f9] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {sup.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{sup.name}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {sup.description}
              </p>

              {/* Popular Products */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Líneas Principales en Ferretería Cruz:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sup.popularProducts.map((prod) => (
                    <span
                      key={prod}
                      className="text-[10px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                    >
                      <PackageCheck className="w-3 h-3 text-[#0f03f9]" />
                      <span>{prod}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Footer Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              <a
                href={sup.portalUrl || sup.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-lg bg-[#0f03f9] hover:bg-[#0c02cb] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs group"
              >
                <Globe className="w-4 h-4" />
                <span>Ir al Sitio / Portal Oficial</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
