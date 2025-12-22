'use client';

interface CreateEmailButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function CreateEmailButton({ onClick, disabled = false }: CreateEmailButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative px-6 py-3 bg-[#FF5500] text-white rounded-xl font-medium hover:bg-[#FF6600] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-3"
    >
      <svg
        className="w-5 h-5 transition-transform group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <span>Crear Nuevo Email</span>
    </button>
  );
}
