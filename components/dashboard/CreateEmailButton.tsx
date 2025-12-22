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
      className="group relative inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#1c1c1c] px-8 text-lg font-medium text-[#FDFCF8] transition-all hover:bg-[#1c1c1c]/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
    >
      <span className="font-serif italic">Crear Nuevo Email</span>
      <svg
        className="w-5 h-5 transition-transform group-hover:translate-x-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </button>
  );
}
