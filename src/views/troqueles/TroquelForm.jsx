// src/components/common/TroquelFormModal.jsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import troquelesService from "../../services/troqueles.service"; // tu servicio API
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

export default function TroquelFormModal({
  isOpen,
  onClose,
  onSuccess,
  troquelId,
}) {
  const isEditing = !!troquelId;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    elaboration_date: new Date(),
    size: "SMALL",
    fileBase64: "",
    file: "",
    is_active: true,
  });

  useEffect(() => {
    if (isOpen && isEditing) fetchTroquel();
    if (!isOpen) resetForm();
  }, [isOpen, troquelId]);

  const resetForm = () => {
    setForm({
      elaboration_date: new Date(),
      size: "SMALL",
      fileBase64: "",
      file: "",
      is_active: true,
    });
    setErrors({});
  };

  const fetchTroquel = async () => {
    try {
      setFetching(true);
      const data = await troquelesService.getById(troquelId);
      const t = data.data.troquel;

      setForm({
        elaboration_date: new Date(t.elaboration_date),
        size: t.size || "SMALL",
        fileBase64: t.file_base64 || "",
        file: t.file || "",
        is_active: t.is_active ?? true,
      });
    } catch {
      toast.error("Error al cargar el troquel");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.elaboration_date) newErrors.elaboration_date = "Fecha requerida";
    if (!form.size) newErrors.size = "Selecciona un tamaño";
    if (!form.fileBase64) newErrors.file = "Selecciona un archivo";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        elaboration_date: form.elaboration_date.toISOString(),
        size: form.size,
        fileBase64: form.fileBase64,
        file: form.file,
        is_active: form.is_active,
      };

      let result;
      if (isEditing) {
        result = await troquelesService.update(troquelId, payload);
        toast.success("Troquel actualizado");
      } else {
        result = await troquelesService.create(payload);
        toast.success("Troquel creado");
      }

      onSuccess(result?.data?.troquel || payload);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        fileBase64: reader.result.split(",")[1],
        file: file,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-[#13529a]">
            {isEditing ? "Editar Troquel" : "Nuevo Troquel"}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={28} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Calendar */}
              <div className="space-y-1">
                <Label>Fecha de Elaboración</Label>
                <Calendar
                  mode="single"
                  selected={form.elaboration_date}
                  onSelect={(date) =>
                    setForm((prev) => ({ ...prev, elaboration_date: date }))
                  }
                  className="rounded-lg border"
                  captionLayout="dropdown"
                />
                {errors.elaboration_date && (
                  <p className="text-xs text-red-500">
                    {errors.elaboration_date}
                  </p>
                )}
              </div>

              {/* Tamaño */}
              <div className="space-y-1">
                <Label>Tamaño</Label>
                <Select
                  value={form.size}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, size: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">SMALL</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="LARGE">LARGE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Archivo */}
              <div className="space-y-1">
                <Label>Archivo de Troquel</Label>
                <Input type="file" onChange={handleFileChange} />
                {form.fileName && (
                  <p className="text-sm text-gray-600">
                    Archivo seleccionado: {form.file}
                  </p>
                )}
                {errors.file && (
                  <p className="text-xs text-red-500">{errors.file}</p>
                )}
              </div>

              {/* Toggle is_active */}
              <div className="space-y-1">
                <Label>Estado</Label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    form.is_active ? "bg-[#13529a]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      form.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="ml-2 text-sm text-gray-700">
                  {form.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 h-8 text-sm cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-8 text-sm bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={14} className="mr-2" />
                      {isEditing ? "Actualizar" : "Crear Troquel"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
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
