// src/components/common/NumericKeypadDialog.jsx
import { useEffect, useState } from "react";
import { Delete, X } from "lucide-react";

/**
 * NumericKeypadDialog - Modal tipo calculadora (0-9) para digitar cantidades
 * en tablet/celular sin usar el teclado del dispositivo (evita errores).
 *
 * Props:
 *  - isOpen       {boolean}   Controla si el modal está visible
 *  - onClose      {function}  Cancelar / cerrar (deja el valor como estaba)
 *  - onConfirm    {function}  (value:number) => void  Confirmar el valor digitado
 *  - title        {string}    Título del modal
 *  - description  {string}    Texto de ayuda opcional
 *  - initialValue {number|string} Valor con el que arranca el display
 *  - confirmText  {string}    Texto del botón confirmar (default: "Confirmar")
 */
export default function NumericKeypadDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Digitar cantidad",
  description = "",
  initialValue = "",
  confirmText = "Confirmar",
}) {
  const [entry, setEntry] = useState("");

  useEffect(() => {
    if (isOpen) {
      const initial =
        initialValue == null || Number.isNaN(Number(initialValue))
          ? ""
          : String(initialValue);
      setEntry(initial);
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleConfirm();
      if (/^\d$/.test(e.key)) pushDigit(e.key);
      if (e.key === "Backspace") backspace();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entry]);

  if (!isOpen) return null;

  const pushDigit = (digit) => {
    setEntry((prev) => {
      // Evita ceros a la izquierda tipo "007"
      const next = prev === "0" ? digit : `${prev}${digit}`;
      return next.slice(0, 9); // tope defensivo de longitud
    });
  };

  const backspace = () => setEntry((prev) => prev.slice(0, -1));
  const clear = () => setEntry("");

  const handleConfirm = () => {
    const value = entry === "" ? 0 : Number(entry);
    if (Number.isNaN(value) || value < 0) return;
    onConfirm(value);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keypad-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="keypad-dialog-title"
                className="text-lg font-semibold leading-tight text-gray-900"
              >
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Display */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-right">
            <span className="text-3xl font-bold tabular-nums text-gray-900">
              {entry === "" ? "0" : entry}
            </span>
          </div>

          {/* Teclado */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {keys.map((k) => (
              <button
                key={k}
                onClick={() => pushDigit(k)}
                className="h-14 rounded-xl border border-gray-200 bg-white text-2xl font-semibold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
              >
                {k}
              </button>
            ))}
            <button
              onClick={clear}
              className="h-14 rounded-xl border border-gray-200 bg-white text-lg font-semibold text-red-500 transition-colors hover:bg-red-50 active:bg-red-100 cursor-pointer"
            >
              C
            </button>
            <button
              onClick={() => pushDigit("0")}
              className="h-14 rounded-xl border border-gray-200 bg-white text-2xl font-semibold text-gray-800 transition-colors hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
            >
              0
            </button>
            <button
              onClick={backspace}
              className="flex h-14 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
              aria-label="Borrar"
            >
              <Delete size={22} />
            </button>
          </div>

          {/* Acciones */}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer sm:w-auto"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 cursor-pointer sm:w-auto"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes animateIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: animateIn 0.18s ease-out forwards; }
      `}</style>
    </div>
  );
}
