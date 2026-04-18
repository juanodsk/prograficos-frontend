import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ordersService from "@/services/orders.service";
import orderProcessesService from "@/services/order_processes.service";
import machineryService from "@/services/machinery.service";
import { connectSocket } from "@/services/socket.service";
import StatusBadge from "@/components/common/StatusBadge";
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
import { useAuthStore } from "@/store/authStore";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  PlayCircle,
  RefreshCw,
} from "lucide-react";

const isOperatorSignatureField = (field) => {
  const key = field?.key?.toLowerCase() || "";
  const label = field?.label?.toLowerCase() || "";
  return key.includes("firma_operario") || label.includes("firma operario");
};

const formatMachineryLabel = (machinery) => {
  if (!machinery) return "Selecciona una maquinaria";
  const code = machinery.reference || machinery.code;
  return code ? `${machinery.name} · Código ${code}` : machinery.name;
};

const formatMeasureLabel = (measure) => {
  if (!measure) return "Selecciona una medida";
  const formatName = measure.format?.name || measure.format_name;
  const size =
    measure.width && measure.height
      ? `${measure.width} x ${measure.height}`
      : measure.name || "Medida sin definir";
  return formatName ? `${formatName} · ${size}` : size;
};

const getOrderClientLabel = (order) =>
  order?.product?.third?.company_name ||
  order?.product?.third?.name ||
  "Sin cliente";

const getOrderProductLabel = (order) =>
  order?.product?.name ||
  order?.product?.troquel?.code ||
  order?.troquel?.code ||
  "Sin producto";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [catalogs, setCatalogs] = useState({ machinery: [] });
  const [activeProcessId, setActiveProcessId] = useState(null);
  const [expandedProcessId, setExpandedProcessId] = useState(null);
  const [startPayload, setStartPayload] = useState({
    machinery_id: "",
    observations: "",
    field_values: {},
  });
  const [finishPayload, setFinishPayload] = useState({
    quantity_delivered: "",
    quantity_damaged: "",
  });
  const [submittingAction, setSubmittingAction] = useState("");

  const canOperate = ["ADMIN", "SUPERVISOR", "EMPLOYEE", "USER"].includes(
    user?.role,
  );

  const loadData = async (silent = false) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const [orderRes, processRes] = await Promise.all([
        ordersService.getById(id),
        orderProcessesService.getByOrder(id),
      ]);
      const [machineryRes] = await Promise.allSettled([
        machineryService.getAll({ onlyActive: true }),
      ]);
      setOrder(orderRes?.data || null);
      setProcesses(processRes?.data || []);
      setCatalogs({
        machinery:
          machineryRes.status === "fulfilled"
            ? machineryRes.value?.data || []
            : [],
      });
    } catch {
      toast.error("Error al cargar el detalle de la orden");
      navigate("/ordenes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const socket = connectSocket();
    const handleProductionChange = (payload) => {
      if (!payload?.orderId || String(payload.orderId) === String(id)) {
        loadData(true);
      }
    };

    socket.on("production:changed", handleProductionChange);

    return () => {
      socket.off("production:changed", handleProductionChange);
    };
  }, [id]);

  const activeProcess = useMemo(
    () =>
      processes.find((p) => p.id === activeProcessId) || processes[0] || null,
    [processes, activeProcessId],
  );

  const orderInputLocked = useMemo(
    () => processes.some((process) => process.process_state !== "PENDIENTE"),
    [processes],
  );

  const processInputLocked = activeProcess
    ? activeProcess.process_state !== "PENDIENTE"
    : false;

  const activeProcessIndex = useMemo(
    () => processes.findIndex((process) => process.id === activeProcess?.id),
    [processes, activeProcess],
  );

  const previousProcess =
    activeProcessIndex > 0 ? processes[activeProcessIndex - 1] : null;

  const sharedMeasure = order?.measure || null;

  const sharedMeasureDisplay = sharedMeasure
    ? formatMeasureLabel(sharedMeasure)
    : "Aun no definida";

  const startBlockedByPreviousProcess =
    activeProcess?.process_state === "PENDIENTE" &&
    previousProcess &&
    previousProcess.process_state !== "TERMINADO";

  const canFinishActiveProcess = activeProcess?.process_state === "EN_PROCESO";

  useEffect(() => {
    if (!activeProcess) return;
    setActiveProcessId(activeProcess.id);
    setExpandedProcessId(activeProcess.id);
    const values = Object.fromEntries(
      (activeProcess.field_values || []).map((v) => [
        v.field_definition_id,
        String(v.value ?? ""),
      ]),
    );
    setStartPayload({
      machinery_id: activeProcess.machinery_id
        ? String(activeProcess.machinery_id)
        : "",
      observations: activeProcess.observations || "",
      field_values: values,
    });
    setFinishPayload({
      quantity_delivered:
        activeProcess.quantity_delivered != null
          ? String(activeProcess.quantity_delivered)
          : "",
      quantity_damaged:
        activeProcess.quantity_damaged != null
          ? String(activeProcess.quantity_damaged)
          : "",
    });
  }, [activeProcess]);

  const fmtDate = (v) =>
    v ? new Date(v).toLocaleDateString("es-CO") : "Sin registrar";
  const fmtHour = (v) =>
    v ? new Date(v).toLocaleTimeString("es-CO") : "Sin registrar";
  const machineLabel = (id) => {
    const machinery = catalogs.machinery.find((m) => String(m.id) === id);
    return formatMachineryLabel(machinery);
  };
  const mapFieldValues = (fieldValues) =>
    Object.entries(fieldValues)
      .filter(([, value]) => value !== "" && value != null)
      .map(([field_definition_id, value]) => ({
        field_definition_id: Number(field_definition_id),
        value,
      }));
  const displayValue = (field, raw) => {
    if (raw == null || raw === "") return "-";
    return field.field_type === "BOOLEAN"
      ? raw === "true"
        ? "Si"
        : "No"
      : raw;
  };
  const toggleExpanded = (processId) =>
    setExpandedProcessId((prev) => (prev === processId ? null : processId));

  const dynamicInput = (field, value, onChange, disabled = false) => {
    if (field.field_type === "BOOLEAN") {
      const enabled = value === "true";
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            role="switch"
            aria-checked={enabled}
            onClick={() => onChange(enabled ? "false" : "true")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
              enabled ? "bg-[#13529a]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">{enabled ? "Si" : "No"}</span>
        </div>
      );
    }
    if (field.field_type === "SELECT") {
      const options = Array.isArray(field.options) ? field.options : [];
      return (
        <Select value={value} disabled={disabled} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={`Selecciona ${field.label.toLowerCase()}`}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{field.label}</SelectLabel>
              {options.map((o) => (
                <SelectItem key={o} value={String(o)}>
                  {o}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    }
    if (field.field_type === "TEXTAREA") {
      return (
        <textarea
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-24 w-full rounded-lg border border-input px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        />
      );
    }
    const type =
      field.field_type === "NUMBER"
        ? "number"
        : field.field_type === "DATE"
          ? "date"
          : field.field_type === "TIME"
            ? "time"
            : "text";
    return (
      <Input
        disabled={disabled}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  const submitStart = async () => {
    if (!activeProcess) return;
    if (activeProcess.process_state !== "PENDIENTE") {
      toast.error(
        "Los datos de entrada ya quedaron bloqueados para este proceso",
      );
      return;
    }
    if (startBlockedByPreviousProcess) {
      toast.error(
        `Debes terminar ${previousProcess?.process?.name || "el proceso anterior"} antes de iniciar este proceso`,
      );
      return;
    }
    try {
      setSubmittingAction("start");
      const payload = {
        machinery_id: startPayload.machinery_id
          ? Number(startPayload.machinery_id)
          : undefined,
        observations: startPayload.observations || undefined,
        field_values: mapFieldValues(startPayload.field_values),
      };

      await orderProcessesService.start(activeProcess.id, payload);
      toast.success("Proceso iniciado exitosamente");
      await loadData(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo iniciar el proceso",
      );
    } finally {
      setSubmittingAction("");
    }
  };

  const submitFinish = async () => {
    if (!activeProcess) return;
    if (activeProcess.process_state !== "EN_PROCESO") {
      toast.error("Debes iniciar el proceso antes de poder finalizarlo");
      return;
    }
    try {
      setSubmittingAction("finish");
      await orderProcessesService.finish(activeProcess.id, {
        quantity_delivered: Number(finishPayload.quantity_delivered || 0),
        quantity_damaged: Number(finishPayload.quantity_damaged || 0),
      });
      toast.success("Proceso finalizado exitosamente");
      await loadData(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo finalizar el proceso",
      );
    } finally {
      setSubmittingAction("");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#13529a]" />
      </div>
    );
  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">
            Orden De Produccion #{order.id}
          </h1>
          <p className="text-sm text-gray-500">
            Explora cada etapa de la orden con paneles desplegables y diligencia
            solo la información necesaria en cada proceso.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/ordenes")}
            className="cursor-pointer"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            className="cursor-pointer"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "mr-2 animate-spin" : "mr-2"}
            />
            Recargar
          </Button>
          <Button
            disabled={orderInputLocked}
            onClick={() => navigate(`/ordenes/${order.id}/editar`)}
            className="bg-[#13529a] text-white hover:bg-[#0f3f7a] cursor-pointer"
          >
            Editar orden
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#eef7ff_0%,#d8ebf7_100%)] px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Orden De Produccion
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                {getOrderProductLabel(order)}
              </h2>
              <p className="max-w-2xl text-sm text-slate-600">
                Vista operativa de la orden. Abre cada proceso para registrar
                avances, revisar datos diligenciados y continuar el flujo de
                producción.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.order_status} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Fecha
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {fmtDate(order.date)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cliente
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {getOrderClientLabel(order)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Producto
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {getOrderProductLabel(order)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Codigo troquel
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.troquel?.code || `Troquel #${order.troquel_id}`}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cavidades
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.cavities || 1}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Tipo de papel
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.paper_type?.name || "Sin papel"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Gramaje
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.paper_type?.grammage || "-"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cantidad de pliegos
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.amount_sheets}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Formato y tamaño
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.measure ? formatMeasureLabel(order.measure) : "-"}
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 p-4">
          {processes.map((process, index) => {
            const isActive = activeProcess?.id === process.id;
            const isExpanded = expandedProcessId === process.id;
            const storedValues = new Map(
              (process.field_values || []).map((v) => [
                v.field_definition_id,
                v.value,
              ]),
            );
            const defs = (process.process?.field_definitions || []).filter(
              (field) => !isOperatorSignatureField(field),
            );
            const filledDefs = defs.filter((field) => {
              const value = storedValues.get(field.id);
              return value != null && value !== "";
            });
            return (
              <section
                key={process.id}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
                  isExpanded
                    ? "border-[#13529a]/40 shadow-[0_12px_30px_rgba(19,82,154,0.12)]"
                    : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveProcessId(process.id);
                    toggleExpanded(process.id);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-all duration-300 ${
                    isExpanded
                      ? "bg-[linear-gradient(135deg,#dbeafe_0%,#eff6ff_65%,#f8fbff_100%)]"
                      : "bg-slate-100/80 hover:bg-slate-200/80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-[#13529a] px-3 py-1 text-xs font-bold text-white shadow-sm">
                      P{String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Proceso
                      </p>
                      <p className="font-semibold text-slate-900">
                        {process.process?.name || `Proceso #${process.id}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {filledDefs.length} campos diligenciados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={process.process_state} />
                    <ChevronDown
                      size={18}
                      className={`text-slate-500 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-slate-200">
                      <div className="grid gap-4 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Fecha inicio
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {fmtDate(process.start_date)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Hora inicio
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {fmtHour(process.start_hour)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Fecha final
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {fmtDate(process.end_date)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Hora final
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {fmtHour(process.end_hour)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Unidades entregadas
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {process.quantity_delivered ?? 0}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Unidades dañadas
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {process.quantity_damaged ?? 0}
                          </p>
                        </div>
                      </div>

                      {filledDefs.length > 0 && (
                        <div className="border-t border-slate-200 bg-white p-5">
                          <div className="mb-3">
                            <h3 className="text-sm font-semibold text-slate-900">
                              Datos diligenciados
                            </h3>
                            <p className="text-xs text-slate-500">
                              Solo se muestran los campos que ya tienen
                              información registrada.
                            </p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {filledDefs.map((field) => (
                              <div
                                key={field.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  {field.label}
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {displayValue(
                                    field,
                                    storedValues.get(field.id),
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isActive && (
                        <div className="grid border-t border-slate-200 lg:grid-cols-2">
                          <div className="border-r border-slate-200 p-5 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-[#13529a]">
                              Iniciar proceso
                            </h3>
                            {startBlockedByPreviousProcess && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Debes terminar{" "}
                                <span className="font-semibold">
                                  {previousProcess?.process?.name ||
                                    "el proceso anterior"}
                                </span>{" "}
                                antes de iniciar este proceso.
                              </div>
                            )}
                            {processInputLocked && (
                              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Los datos de entrada quedaron bloqueados desde
                                que este proceso fue iniciado.
                              </div>
                            )}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Medida de corte de la orden
                              </p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {sharedMeasureDisplay}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Maquinaria</Label>
                              <Select
                                value={startPayload.machinery_id}
                                disabled={processInputLocked}
                                onValueChange={(value) =>
                                  setStartPayload((p) => ({
                                    ...p,
                                    machinery_id: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecciona una maquinaria">
                                    {startPayload.machinery_id
                                      ? machineLabel(startPayload.machinery_id)
                                      : null}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>
                                      Maquinaria disponible
                                    </SelectLabel>
                                    {catalogs.machinery.map((m) => (
                                      <SelectItem
                                        key={m.id}
                                        value={String(m.id)}
                                      >
                                        {formatMachineryLabel(m)}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                            {defs.map((field) => (
                              <div key={field.id} className="space-y-2">
                                <Label>
                                  {field.label}
                                  {field.is_required ? " *" : ""}
                                </Label>
                                {dynamicInput(
                                  field,
                                  startPayload.field_values[field.id] || "",
                                  (value) =>
                                    setStartPayload((p) => ({
                                      ...p,
                                      field_values: {
                                        ...p.field_values,
                                        [field.id]: value,
                                      },
                                    })),
                                  processInputLocked,
                                )}
                              </div>
                            ))}
                            <div className="space-y-2">
                              <Label>Observaciones</Label>
                              <Input
                                disabled={processInputLocked}
                                value={startPayload.observations}
                                onChange={(e) =>
                                  setStartPayload((p) => ({
                                    ...p,
                                    observations: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <Button
                              onClick={submitStart}
                              disabled={
                                !canOperate ||
                                activeProcess?.process_state !== "PENDIENTE" ||
                                startBlockedByPreviousProcess ||
                                submittingAction === "start"
                              }
                              className="h-16 w-full rounded-xl bg-blue-600 px-5 text-base font-semibold text-white hover:bg-blue-700 cursor-pointer"
                            >
                              {submittingAction === "start" ? (
                                <>
                                  <Loader2
                                    size={18}
                                    className="mr-2 animate-spin"
                                  />
                                  Iniciando...
                                </>
                              ) : (
                                <>
                                  <PlayCircle size={18} className="mr-2" />
                                  Iniciar proceso
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="p-5 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-[#13529a]">
                              Finalizar proceso
                            </h3>
                            {!canFinishActiveProcess && (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                {activeProcess?.process_state === "TERMINADO"
                                  ? "Este proceso ya fue finalizado."
                                  : "Debes iniciar el proceso antes de poder finalizarlo."}
                              </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Cantidad entregada</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  disabled={!canFinishActiveProcess}
                                  value={finishPayload.quantity_delivered}
                                  onChange={(e) =>
                                    setFinishPayload((p) => ({
                                      ...p,
                                      quantity_delivered: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Cantidad dañada</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  disabled={!canFinishActiveProcess}
                                  value={finishPayload.quantity_damaged}
                                  onChange={(e) =>
                                    setFinishPayload((p) => ({
                                      ...p,
                                      quantity_damaged: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Button
                                  onClick={submitFinish}
                                  disabled={
                                    !canOperate ||
                                    !canFinishActiveProcess ||
                                    submittingAction === "finish"
                                  }
                                  className="h-16 w-full rounded-xl bg-green-600 px-5 text-base font-semibold text-white hover:bg-green-700 cursor-pointer"
                                >
                                  {submittingAction === "finish" ? (
                                    <>
                                      <Loader2
                                        size={18}
                                        className="mr-2 animate-spin"
                                      />
                                      Finalizando...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2
                                        size={18}
                                        className="mr-2"
                                      />
                                      Finalizar proceso
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
