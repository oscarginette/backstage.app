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
      <div className="mb-8 text-center">
        <h3 className="text-3xl font-serif text-[#1c1c1c] mb-2">
          Elige un Punto de Partida
        </h3>
        <p className="text-gray-500 font-light">
          Selecciona cómo quieres empezar tu email
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Opción 1: Email en Blanco */}
        <button
          onClick={onSelectBlank}
          className="group relative p-10 border border-[#E8E6DF] rounded-3xl hover:border-[#1c1c1c] hover:shadow-xl transition-all bg-white text-left"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#1c1c1c] transition-colors duration-300">
              <svg
                className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-serif text-2xl text-[#1c1c1c] mb-2">
                Email en Blanco
              </h4>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Empieza desde cero con un lienzo vacío y diseña tu mensaje.
              </p>
            </div>
          </div>
        </button>

        {/* Opción 2: Template por Defecto */}
        <button
          onClick={onSelectDefault}
          className="group relative p-10 border border-[#E8E6DF] rounded-3xl hover:border-[#1c1c1c] hover:shadow-xl transition-all bg-white text-left"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#1c1c1c] transition-colors duration-300">
              <svg
                className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-serif text-2xl text-[#1c1c1c] mb-2">
                Template Predeterminado
              </h4>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                Usa el diseño optimizado para lanzamientos de tracks.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-[#1c1c1c] transition-colors font-medium border-b border-transparent hover:border-[#1c1c1c]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
