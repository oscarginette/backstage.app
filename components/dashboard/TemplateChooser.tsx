'use client';

interface TemplateChooserProps {
  onSelectBlank: () => void;
  onSelectDefault: () => void;
  onClose: () => void;
}

export default function TemplateChooser({
  onSelectBlank,
  onSelectDefault,
  onClose
}: TemplateChooserProps) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-serif text-[#1c1c1c] mb-2">
          Elige un Punto de Partida
        </h3>
        <p className="text-gray-500">
          Selecciona cómo quieres empezar tu email
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Opción 1: Email en Blanco */}
        <button
          onClick={onSelectBlank}
          className="group relative p-8 border-2 border-dashed border-[#E8E6DF] rounded-2xl hover:border-[#FF5500] hover:bg-[#FF5500]/5 transition-all"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-4 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#FF5500]/10 transition-colors">
              <svg
                className="w-10 h-10 text-gray-400 group-hover:text-[#FF5500] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-lg text-[#1c1c1c] mb-2 group-hover:text-[#FF5500] transition-colors">
              Email en Blanco
            </h4>
            <p className="text-sm text-gray-500">
              Empieza desde cero con un editor vacío
            </p>
          </div>
        </button>

        {/* Opción 2: Template por Defecto */}
        <button
          onClick={onSelectDefault}
          className="group relative p-8 border-2 border-[#E8E6DF] rounded-2xl hover:border-[#FF5500] hover:bg-[#FF5500]/5 transition-all"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-4 rounded-2xl bg-[#FF5500]/10 flex items-center justify-center group-hover:bg-[#FF5500]/20 transition-colors">
              <svg
                className="w-10 h-10 text-[#FF5500]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-lg text-[#1c1c1c] mb-2 group-hover:text-[#FF5500] transition-colors">
              Template Predeterminado
            </h4>
            <p className="text-sm text-gray-500">
              Usa el template de tracks como base
            </p>
          </div>
        </button>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#F5F3ED] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
