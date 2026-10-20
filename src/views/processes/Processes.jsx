import { useAuthStore } from "../../store/authStore";
import { hasPermission } from "@/lib/permissions";
import { useState, useEffect, useCallback, useMemo } from "react";
import processesService from "@/services/processes.service";
import serviceLinesService from "@/services/service_lines.service";

//VIEWS
import ProcessesForm from "./ProcessesForm";
// import MeasuresView from "./MeasuresView";

//COMPONENTS
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

const reorderProcessList = (items, draggedProcessId, targetProcessId) => {
  const draggedIndex = items.findIndex((item) => item.id === draggedProcessId);
  const targetIndex = items.findIndex((item) => item.id === targetProcessId);

  if (
    draggedIndex === -1 ||
    targetIndex === -1 ||
    draggedIndex === targetIndex
  ) {
    return items;
  }

  const nextItems = [...items];
  const [draggedItem] = nextItems.splice(draggedIndex, 1);
  nextItems.splice(targetIndex, 0, draggedItem);

  return nextItems.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
};

const Processes = () => {
  const { user: currentUser } = useAuthStore();
  const canManage = hasPermission(currentUser, "catalogs:manage");
  const [processes, setProcesses] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState("");
  const [loading, setLoading] = useState(true);
  const [draggedProcessId, setDraggedProcessId] = useState(null);
  const [dragTargetProcessId, setDragTargetProcessId] = useState(null);
  const [reordering, setReordering] = useState(false);

  const [formModal, setFormModal] = useState({
    isOpen: false,
    processId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    processId: null,
    processName: "",
    loading: false,
  });

  useEffect(() => {
    fetchProcesses();
  }, []);

  // Líneas de servicio activas para elegir qué flujo ver/ordenar.
  useEffect(() => {
    let active = true;
    serviceLinesService
      .getAll({ onlyActive: true })
      .then((res) => {
        if (!active) return;
        const lines = res?.data || [];
        setServiceLines(lines);
        // Preselecciona la primera línea para mostrar un flujo de una vez.
        setSelectedLineId((prev) => prev || (lines[0] ? String(lines[0].id) : ""));
      })
      .catch(() => {
        if (active) toast.error("Error al cargar las líneas de servicio");
      });
    return () => {
      active = false;
    };
  }, []);

  // Procesos de la línea elegida (el flujo dragable se filtra por línea).
  const visibleProcesses = useMemo(() => {
    if (!selectedLineId) return [];
    return processes.filter((process) =>
      (process.service_lines || []).some(
        (line) => String(line.id) === selectedLineId,
      ),
    );
  }, [processes, selectedLineId]);

  // ───────────── CARGAR PROCESOS ─────────────
  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const [processesRes] = await Promise.all([processesService.getAll()]);
      setProcesses(processesRes?.data || []);
    } catch {
      toast.error("Error al cargar los procesos");
    } finally {
      setLoading(false);
    }
  };

  // ───────────── MODALES ─────────────
  const handleOpenCreate = () =>
    setFormModal({ isOpen: true, processId: null });
  const handleOpenEdit = (id) => setFormModal({ isOpen: true, processId: id });
  const handleCloseForm = () =>
    setFormModal({ isOpen: false, processId: null });

  const handleFormSuccess = () => {
    fetchProcesses();
  };

  const handleDrop = useCallback(async (targetProcessId, sourceProcessId) => {
    const processIdToMove = sourceProcessId ?? draggedProcessId;

    if (
      !processIdToMove ||
      processIdToMove === targetProcessId ||
      reordering
    ) {
      setDraggedProcessId(null);
      setDragTargetProcessId(null);
      return;
    }

    const previousProcesses = processes;
    // El reordenamiento aplica solo a los procesos de la línea visible.
    const reorderedVisible = reorderProcessList(
      visibleProcesses,
      processIdToMove,
      targetProcessId,
    );

    if (reorderedVisible === visibleProcesses) {
      setDraggedProcessId(null);
      setDragTargetProcessId(null);
      return;
    }

    // Mezcla la secuencia reordenada de la línea de vuelta en la lista completa,
    // conservando en su sitio los procesos de otras líneas.
    let visibleIndex = 0;
    const nextProcesses = previousProcesses.map((process) => {
      const isVisible = (process.service_lines || []).some(
        (line) => String(line.id) === selectedLineId,
      );
      return isVisible ? reorderedVisible[visibleIndex++] : process;
    });

    setProcesses(nextProcesses);
    setDraggedProcessId(null);
    setDragTargetProcessId(null);

    try {
      setReordering(true);
      const response = await processesService.reorder(
        reorderedVisible.map((process) => process.id),
      );
      setProcesses(response?.data || nextProcesses);
      toast.success("Orden de procesos actualizado");
    } catch (error) {
      setProcesses(previousProcesses);
      toast.error(
        error?.response?.data?.message ||
          "No se pudo actualizar el orden de los procesos",
      );
    } finally {
      setReordering(false);
    }
  }, [draggedProcessId, processes, reordering, selectedLineId, visibleProcesses]);

  const handlePointerStart = (event, processId) => {
    if (reordering) return;

    event.preventDefault();
    setDraggedProcessId(processId);
    setDragTargetProcessId(processId);
  };

  const handlePointerEnd = useCallback(() => {
    if (!draggedProcessId || reordering) {
      setDraggedProcessId(null);
      setDragTargetProcessId(null);
      return;
    }

    handleDrop(dragTargetProcessId || draggedProcessId, draggedProcessId);
  }, [dragTargetProcessId, draggedProcessId, handleDrop, reordering]);

  useEffect(() => {
    if (!draggedProcessId) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const targetElement = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-process-id]");

      if (!targetElement) return;

      const nextTargetId = Number(targetElement.getAttribute("data-process-id"));

      if (!Number.isNaN(nextTargetId)) {
        setDragTargetProcessId(nextTargetId);
      }
    };

    const handleGlobalPointerUp = () => {
      handlePointerEnd();
    };

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [draggedProcessId, handlePointerEnd]);

  // ───────────── ELIMINAR ─────────────
  const handleDeleteClick = (process) => {
    setConfirmDialog({
      isOpen: true,
      processId: process.id,
      processName: process.name,
      loading: false,
    });
  };

  const handleCloseDialog = () => {
    if (confirmDialog.loading) return;
    setConfirmDialog({
      isOpen: false,
      processId: null,
      processName: "",
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await processesService.delete(confirmDialog.processId);
      await fetchProcesses();
      toast.success(response?.message || "Proceso desactivado exitosamente");
      handleCloseDialog();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo desactivar el proceso",
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  // ───────────── COLUMNAS ─────────────
  const columns = [
    { key: "id", label: "ID" },
    {
      key: "service_lines",
      label: "Líneas",
      render: (row) =>
        (row.service_lines || []).map((line) => line.name).join(", ") || "—",
    },
    { key: "name", label: "Nombre" },
    { key: "category", label: "Categoria" },
    {
      key: "field_definitions",
      label: "Campos",
      render: (row) => row.field_definitions?.length || 0,
    },
    {
      key: "is_active",
      label: "Estado",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.is_active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  // ───────────── ACCIONES ─────────────
  const actions = (row) => {
    const canEdit = canManage;
    const canDelete = canManage;

    return (
      <div className="flex items-center justify-end gap-2">
        {/* Editar */}
        <Button
          size="icon"
          variant="ghost"
          disabled={!canEdit}
          onClick={() => canEdit && handleOpenEdit(row.id)}
          className={
            canEdit
              ? "hover:text-[#13529a] hover:bg-[#13529a]/10 cursor-pointer"
              : "text-gray-300 cursor-not-allowed opacity-50"
          }
        >
          <Pencil size={16} />
        </Button>

        {/* Eliminar */}
        <Button
          size="icon"
          variant="ghost"
          disabled={!canDelete}
          onClick={() => canDelete && handleDeleteClick(row)}
          className={
            canDelete
              ? "text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              : "text-gray-300 cursor-not-allowed opacity-50"
          }
        >
          <Trash2 size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Procesos</h1>
          <p className="text-sm text-gray-500">
            {processes.length} Procesos registrados
          </p>
        </div>

        {canManage && (
          <Button
            onClick={handleOpenCreate}
            className="bg-[#13529a] hover:bg-[#0f3f7a] text-white cursor-pointer"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Proceso
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Selector de línea: define qué flujo de procesos se ve y ordena. */}
            <div className="flex flex-col items-center gap-2 text-center">
              <Label className="text-sm font-medium text-slate-700">
                Línea de servicio
              </Label>
              <Select
                value={selectedLineId}
                onValueChange={(value) => setSelectedLineId(value)}
              >
                <SelectTrigger className="h-10 w-full max-w-sm">
                  <SelectValue placeholder="Selecciona una línea">
                    {serviceLines.find(
                      (line) => String(line.id) === selectedLineId,
                    )?.name || null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Líneas de servicio</SelectLabel>
                    {serviceLines.map((line) => (
                      <SelectItem key={line.id} value={String(line.id)}>
                        {line.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Elige la línea para ver y ordenar sus procesos.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Flujo de procesos
                  </h2>
                  <p className="text-sm text-slate-500">
                    Arrastra cada proceso para definir qué va primero, segundo y
                    así sucesivamente.
                  </p>
                </div>
                {reordering && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-[#13529a] shadow-sm">
                    <Loader2 size={15} className="animate-spin" />
                    Guardando orden...
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3">
                {visibleProcesses.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    {selectedLineId
                      ? "Esta línea aún no tiene procesos."
                      : "Selecciona una línea para ver su flujo de procesos."}
                  </div>
                )}
                {visibleProcesses.map((process, index) => {
                  const isDragging = draggedProcessId === process.id;
                  const isDropTarget =
                    draggedProcessId &&
                    dragTargetProcessId === process.id &&
                    draggedProcessId !== process.id;

                  return (
                    <div
                      key={process.id}
                      data-process-id={process.id}
                      className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 transition-all md:flex-row md:items-center ${
                        isDragging
                          ? "border-[#13529a] shadow-md opacity-75"
                          : isDropTarget
                            ? "border-[#13529a] shadow-sm ring-2 ring-[#13529a]/15"
                          : "border-slate-200 hover:border-[#13529a]/40"
                      } ${reordering ? "cursor-wait" : "cursor-grab"}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onPointerDown={(event) =>
                            canManage && handlePointerStart(event, process.id)
                          }
                          disabled={reordering || !canManage}
                          aria-label={`Mover proceso ${process.name}`}
                          className="rounded-xl bg-[#13529a]/10 p-2 text-[#13529a] touch-none cursor-grab active:cursor-grabbing disabled:cursor-wait"
                        >
                          <GripVertical size={18} />
                        </button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                          {index + 1}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {process.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>{process.category}</span>
                          <span className="text-slate-300">•</span>
                          <span>
                            {process.field_definitions?.length || 0} campo
                            {(process.field_definitions?.length || 0) === 1
                              ? ""
                              : "s"}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span
                            className={
                              process.is_active
                                ? "font-medium text-emerald-600"
                                : "font-medium text-rose-600"
                            }
                          >
                            {process.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Arrastrar
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DataTable
              data={processes}
              columns={columns}
              actions={actions}
              storageKey="config-processes"
            />
          </div>
        )}
      </div>

      <ProcessesForm
        isOpen={formModal.isOpen}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        processId={formModal.processId}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        loading={confirmDialog.loading}
        title="¿Eliminar proceso?"
        description={`Estás a punto de eliminar el proceso "${confirmDialog.processName}". Esta acción es permanente y no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default Processes;
