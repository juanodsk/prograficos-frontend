// src/components/common/ConfirmDialog.jsx
import { useEffect, useRef } from "react";

/**
 * ConfirmDialog - Modal de confirmación reutilizable
 *
 * Props:
 *  - isOpen      {boolean}   Controla si el modal está visible
 *  - onClose     {function}  Se llama al cancelar o cerrar
 *  - onConfirm   {function}  Se llama al confirmar
 *  - title       {string}    Título del modal
 *  - description {string}    Descripción/mensaje de advertencia
 *  - confirmText {string}    Texto del botón de confirmación (default: "Eliminar")
 *  - cancelText  {string}    Texto del botón de cancelar (default: "Cancelar")
 *  - variant     {string}    "danger" | "warning" | "info" (default: "danger")
 *  - loading     {boolean}   Muestra spinner en el botón de confirmar
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
}) {
  const cancelBtnRef = useRef(null);

  // Focus al cancelar cuando abre (accesibilidad)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variants = {
    danger: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBtn:
        "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white cursor-pointer",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
    warning: {
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      confirmBtn:
        "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-white cursor-pointer",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      iconBg: "bg-blue-100",
      iconColor: "text-[#13529a]",
      confirmBtn:
        "bg-[#13529a] hover:bg-[#0e3f7a] focus:ring-[#13529a] text-white",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const v = variants[variant] || variants.danger;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in">
        {/* Franja top con color */}
        <div
          className={`h-1.5 w-full ${variant === "danger" ? "bg-red-500" : variant === "warning" ? "bg-yellow-400" : "bg-[#13529a]"}`}
        />

        <div className="p-6">
          {/* Ícono + Título */}
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-full ${v.iconBg} ${v.iconColor}`}
            >
              {v.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirm-dialog-title"
                className="text-lg font-semibold text-gray-900 leading-tight"
              >
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              ref={cancelBtnRef}
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer ${v.confirmBtn}`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                  Eliminando...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes animateIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in {
          animation: animateIn 0.18s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
