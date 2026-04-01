import { useEffect, useState } from "react";
import { toast } from "sonner";
import processesService from "@/services/processes.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";

const processCategories = [
  "PREPRENSA",
  "CORTE",
  "IMPRESION",
  "ACABADO",
  "TROQUELADO",
  "PEGADO",
  "EMPAQUE",
  "OTRO",
];

const fieldTypes = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "TIME",
  "SELECT",
];

const createFieldUiId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `field-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createFieldDraft = (index = 0, field = {}) => ({
  id: field.id ?? null,
  uiId: field.id ? `field-${field.id}` : createFieldUiId(),
  key: field.key || "",
  label: field.label || "",
  field_type: field.field_type || "TEXT",
  is_required: Boolean(field.is_required),
  sort_order: field.sort_order ?? index + 1,
  options: Array.isArray(field.options) ? field.options.join(", ") : field.options || "",
});

const createInitialFormState = () => ({
  name: "",
  order: "",
  category: "OTRO",
  is_active: true,
  field_definitions: [],
});

const hasConfiguredFieldContent = (field) =>
  Boolean(field.key?.trim() || field.label?.trim() || field.options?.trim());

const ProcessesForm = ({ isOpen, onClose, onSuccess, processId }) => {
  const isEditing = Boolean(processId);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(createInitialFormState);

  useEffect(() => {
    if (!isOpen) {
      setForm(createInitialFormState());
      setErrors({});
      return;
    }

    if (isEditing) {
      loadProcess();
    }
  }, [isOpen, processId]);

  const loadProcess = async () => {
    try {
      setFetching(true);
      const response = await processesService.getById(processId);
      const process = response?.data;

      setForm({
        name: process?.name || "",
        order: process?.order ? String(process.order) : "",
        category: process?.category || "OTRO",
        is_active: process?.is_active ?? true,
        field_definitions:
          process?.field_definitions?.length > 0
            ? process.field_definitions.map((field, index) =>
                createFieldDraft(index, field),
              )
            : [],
      });
    } catch (error) {
      toast.error("No se pudo cargar el proceso");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const updateField = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      field_definitions: prev.field_definitions.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, [key]: value } : field,
      ),
    }));
  };

  const addField = () => {
    setForm((prev) => ({
      ...prev,
      field_definitions: [
        ...prev.field_definitions,
        createFieldDraft(prev.field_definitions.length),
      ],
    }));
  };

  const removeField = (index) => {
    setForm((prev) => {
      const nextFields = prev.field_definitions
        .filter((_, fieldIndex) => fieldIndex !== index)
        .map((field, fieldIndex) => ({
          ...field,
          sort_order: fieldIndex + 1,
        }));

      return {
        ...prev,
        field_definitions: nextFields,
      };
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "El nombre es requerido";
    if (!form.order || Number(form.order) <= 0)
      nextErrors.order = "El orden debe ser mayor a 0";
    if (!form.category) nextErrors.category = "La categoria es obligatoria";

    const configuredFields = form.field_definitions.filter(hasConfiguredFieldContent);

    const invalidField = configuredFields.find(
      (field) => !field.key.trim() || !field.label.trim() || !field.field_type,
    );
    const normalizedKeys = configuredFields.map((field) => field.key.trim().toLowerCase());
    const hasDuplicateKeys = normalizedKeys.some(
      (key, index) => key && normalizedKeys.indexOf(key) !== index,
    );

    if (invalidField) {
      nextErrors.field_definitions =
        "Todos los campos configurables deben tener clave, nombre y tipo";
    } else if (hasDuplicateKeys) {
      nextErrors.field_definitions =
        "No puedes repetir la clave en los campos configurables";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const normalizeFieldDefinitions = () =>
    form.field_definitions
      .filter(hasConfiguredFieldContent)
      .map((field, index) => ({
        id: field.id,
        key: field.key.trim(),
        label: field.label.trim(),
        field_type: field.field_type,
        is_required: Boolean(field.is_required),
        sort_order: index + 1,
        options:
          field.field_type === "SELECT" && field.options.trim()
            ? field.options
                .split(",")
                .map((option) => option.trim())
                .filter(Boolean)
            : null,
      }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      order: Number(form.order),
      category: form.category,
      is_active: form.is_active,
      field_definitions: normalizeFieldDefinitions(),
    };

    try {
      setLoading(true);
      const response = isEditing
        ? await processesService.update(processId, payload)
        : await processesService.create(payload);

      toast.success(
        isEditing ? "Proceso actualizado exitosamente" : "Proceso creado exitosamente",
      );
      onSuccess(response?.data || payload);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo guardar el proceso");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#13529a]">
              {isEditing ? "Editar proceso" : "Nuevo proceso"}
            </h2>
            <p className="text-sm text-gray-500">
              Configura la etapa de producción y los campos que deberá diligenciar.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.order}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, order: e.target.value }))
                    }
                  />
                  {errors.order && (
                    <p className="text-xs text-red-500">{errors.order}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categorias</SelectLabel>
                        {processCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-xs text-red-500">{errors.category}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        is_active: !prev.is_active,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                      form.is_active ? "bg-[#13529a]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        form.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {form.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Campos configurables
                    </h3>
                    <p className="text-sm text-gray-500">
                      Define qué datos deberá diligenciar este proceso en producción.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addField}
                    className="bg-[#13529a] text-white hover:bg-[#0f3f7a] cursor-pointer"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar campo
                  </Button>
                </div>

                {errors.field_definitions && (
                  <p className="text-xs text-red-500">{errors.field_definitions}</p>
                )}

                <div className="space-y-4">
                  {form.field_definitions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                      <p className="text-sm font-medium text-gray-700">
                        Este proceso no tiene campos adicionales.
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Puedes guardarlo asi o agregar campos configurables cuando lo
                        necesites.
                      </p>
                    </div>
                  )}

                  {form.field_definitions.map((field, index) => (
                    <div
                      key={field.uiId}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          Campo #{index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeField(index)}
                          className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="space-y-2">
                          <Label>Clave</Label>
                          <Input
                            value={field.key}
                            onChange={(e) =>
                              updateField(index, "key", e.target.value)
                            }
                            placeholder="ej: color_1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Etiqueta</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              updateField(index, "label", e.target.value)
                            }
                            placeholder="ej: Color 1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={field.field_type}
                            onValueChange={(value) =>
                              updateField(index, "field_type", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Tipos</SelectLabel>
                                {fieldTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Orden</Label>
                          <Input
                            type="number"
                            min="1"
                            value={field.sort_order}
                            onChange={(e) =>
                              updateField(index, "sort_order", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Obligatorio</Label>
                          <Select
                            value={field.is_required ? "true" : "false"}
                            onValueChange={(value) =>
                              updateField(index, "is_required", value === "true")
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Si</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {field.field_type === "SELECT" && (
                        <div className="mt-4 space-y-2">
                          <Label>Opciones</Label>
                          <Input
                            value={field.options}
                            onChange={(e) =>
                              updateField(index, "options", e.target.value)
                            }
                            placeholder="Ej: Mate, Brillante, Satinado"
                          />
                          <p className="text-xs text-gray-500">
                            Separa las opciones por comas.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#13529a] text-white hover:bg-[#0f3f7a] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      {isEditing ? "Actualizar" : "Crear"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessesForm;
