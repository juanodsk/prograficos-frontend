import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ordersService from "@/services/orders.service";
import thirdsService from "@/services/thirds.service";
import measuresService from "@/services/measures.service";
import paperTypesService from "@/services/paper_types.service";
import productsService from "@/services/products.service";
import processesService from "@/services/processes.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTroquelLabel } from "@/lib/troquel";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const formatFormatLabel = (format) => {
  if (!format) return "Formato sin definir";
  return format.name || "Formato sin definir";
};

const formatMeasureLabel = (measure) => {
  if (!measure) return "Medida sin definir";
  const size =
    measure.width && measure.height
      ? `${measure.width} x ${measure.height}`
      : measure.name || "Medida sin definir";
  return size;
};

const formatPaperTypeLabel = (paperType) => {
  if (!paperType) return "Tipo de papel sin definir";
  const name = paperType.name || "Papel sin nombre";
  return paperType.grammage ? `${name} - ${paperType.grammage} gr` : name;
};

const formatThirdLabel = (third) => {
  if (!third) return "Cliente sin definir";
  return third.company_name || third.name || "Cliente sin definir";
};

const formatProductLabel = (product) => {
  if (!product) return "Producto sin definir";
  if (product.name) return product.name;
  const thirdName =
    product.third?.company_name ||
    product.third?.name ||
    product.third_name ||
    product.client_name;
  const troquelName = product.troquel
    ? formatTroquelLabel(product.troquel, "")
    : product.troquel_code || product.troquel_name;

  if (thirdName && troquelName) return `${thirdName} · ${troquelName}`;
  if (troquelName) return troquelName;
  if (thirdName) return thirdName;
  return "Producto sin definir";
};

const parseSheetDivisionsFromFormatName = (value) => {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return null;

  const fractionMatch = normalizedValue.match(/1\s*\/\s*(\d+)/i);
  if (!fractionMatch) return null;

  const parsedDivisions = Number(fractionMatch[1]);
  return Number.isFinite(parsedDivisions) && parsedDivisions > 0
    ? parsedDivisions
    : null;
};

const resolveSheetDivisions = (format) => {
  const configuredDivisions = Number(format?.sheet_divisions);

  if (Number.isInteger(configuredDivisions) && configuredDivisions > 0) {
    return configuredDivisions;
  }

  return parseSheetDivisionsFromFormatName(format?.name) || 1;
};

const normalizePositiveInteger = (value) => {
  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return null;
  }

  return Math.ceil(normalizedValue);
};

const OrderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [isOrderLocked, setIsOrderLocked] = useState(false);
  const [catalogs, setCatalogs] = useState({
    formats: [],
    measures: [],
    thirds: [],
    paperTypes: [],
    products: [],
    processes: [],
  });
  const [form, setForm] = useState({
    calculation_mode: "TOTAL_REQUIRED",
    amount_sheets: "",
    cavities: "1",
    total_estimated: "",
    format_id: "",
    measure_id: "",
    third_id: "",
    paper_type_id: "",
    troquel_id: "",
    product_id: "",
    processes: [],
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setFetching(true);
      const [
        measuresRes,
        thirdsRes,
        paperTypesRes,
        productsRes,
        processesRes,
        orderRes,
      ] = await Promise.all([
        measuresService.getAll({ onlyActive: true }),
        thirdsService.getAll({ onlyActive: true, pageSize: 1000 }),
        paperTypesService.getAll({ onlyActive: true }),
        productsService.getAll({ onlyActive: true, pageSize: 1000 }),
        processesService.getAll({ onlyActive: true }),
        isEditing ? ordersService.getById(id) : Promise.resolve(null),
      ]);

      const measures = measuresRes?.data || [];
      const formats = Array.from(
        new Map(
          measures
            .filter((measure) => measure.format?.id)
            .map((measure) => [measure.format.id, measure.format]),
        ).values(),
      ).sort((a, b) =>
        formatFormatLabel(a).localeCompare(formatFormatLabel(b), "es", {
          sensitivity: "base",
        }),
      );

      const thirds = (thirdsRes?.data?.thirds || []).filter(
        (third) => third.type_person === "CLIENTE",
      );

      setCatalogs({
        formats,
        measures,
        thirds,
        paperTypes: paperTypesRes?.data || [],
        products: productsRes?.data?.products || [],
        processes: (processesRes?.data || []).sort((a, b) => a.order - b.order),
      });

      if (orderRes?.data) {
        const order = orderRes.data;
        setIsOrderLocked(
          (order.detail_production_orders || []).some(
            (detail) => detail.process_state !== "PENDIENTE",
          ),
        );
        setForm({
          calculation_mode: "TOTAL_REQUIRED",
          amount_sheets: order.amount_sheets ? String(order.amount_sheets) : "",
          cavities: order.cavities ? String(order.cavities) : "1",
          total_estimated: order.total_estimated
            ? String(order.total_estimated)
            : "",
          format_id: order.measure?.format?.id
            ? String(order.measure.format.id)
            : "",
          measure_id: order.measure_id ? String(order.measure_id) : "",
          third_id: order.product?.third_id
            ? String(order.product.third_id)
            : "",
          paper_type_id: order.paper_type_id ? String(order.paper_type_id) : "",
          troquel_id: order.troquel_id ? String(order.troquel_id) : "",
          product_id: order.product_id ? String(order.product_id) : "",
          processes:
            order.detail_production_orders?.map((detail) =>
              String(detail.process_id),
            ) || [],
        });
      } else {
        setIsOrderLocked(false);
      }
    } catch {
      toast.error("Error al cargar la información de la orden");
      navigate("/ordenes");
    } finally {
      setFetching(false);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleProcess = (processId, checked) => {
    setForm((prev) => ({
      ...prev,
      processes: checked
        ? [...prev.processes, processId]
        : prev.processes.filter((id) => id !== processId),
    }));
    if (errors.processes) setErrors((prev) => ({ ...prev, processes: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.cavities || Number(form.cavities) <= 0)
      nextErrors.cavities = "La cantidad de cavidades debe ser mayor a 0";
    if (
      form.calculation_mode === "SHEETS_REQUIRED" &&
      (!form.amount_sheets || Number(form.amount_sheets) <= 0)
    )
      nextErrors.amount_sheets = "La cantidad de pliegos debe ser mayor a 0";
    if (
      form.calculation_mode === "TOTAL_REQUIRED" &&
      (!form.total_estimated || Number(form.total_estimated) <= 0)
    )
      nextErrors.total_estimated = "El total requerido debe ser mayor a 0";
    if (!form.format_id) nextErrors.format_id = "Selecciona un formato";
    if (!form.measure_id) nextErrors.measure_id = "Selecciona un tamaño";
    if (!form.third_id) nextErrors.third_id = "Selecciona un cliente";
    if (!form.paper_type_id)
      nextErrors.paper_type_id = "Selecciona un tipo de papel";
    if (!form.troquel_id)
      nextErrors.troquel_id =
        "No se encontró troquel para el producto seleccionado";
    if (!form.product_id) nextErrors.product_id = "Selecciona un producto";
    if (!form.processes.length)
      nextErrors.processes = "Selecciona al menos un proceso";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const selectedProcesses = useMemo(
    () =>
      catalogs.processes.filter((process) =>
        form.processes.includes(String(process.id)),
      ),
    [catalogs.processes, form.processes],
  );

  const selectedFormat = useMemo(
    () =>
      catalogs.formats.find((format) => String(format.id) === form.format_id) ||
      null,
    [catalogs.formats, form.format_id],
  );

  const selectedMeasure = useMemo(
    () =>
      catalogs.measures.find(
        (measure) => String(measure.id) === form.measure_id,
      ) || null,
    [catalogs.measures, form.measure_id],
  );

  const selectedThird = useMemo(
    () =>
      catalogs.thirds.find((third) => String(third.id) === form.third_id) ||
      null,
    [catalogs.thirds, form.third_id],
  );

  const selectedPaperType = useMemo(
    () =>
      catalogs.paperTypes.find(
        (paperType) => String(paperType.id) === form.paper_type_id,
      ) || null,
    [catalogs.paperTypes, form.paper_type_id],
  );

  const selectedProduct = useMemo(
    () =>
      catalogs.products.find(
        (product) => String(product.id) === form.product_id,
      ) || null,
    [catalogs.products, form.product_id],
  );

  const selectedTroquel = selectedProduct?.troquel || null;

  const sheetDivisions = useMemo(
    () => resolveSheetDivisions(selectedFormat),
    [selectedFormat],
  );

  const unitsPerSheet = useMemo(() => {
    const cavities = normalizePositiveInteger(form.cavities);
    if (!selectedMeasure || !cavities) return 0;
    return sheetDivisions * cavities;
  }, [form.cavities, selectedMeasure, sheetDivisions]);

  const availableMeasures = useMemo(() => {
    if (!form.format_id) return [];

    return catalogs.measures
      .filter((measure) => String(measure.format_id) === form.format_id)
      .sort((a, b) => {
        if (Number(a.width) !== Number(b.width)) {
          return Number(a.width) - Number(b.width);
        }
        return Number(a.height) - Number(b.height);
      });
  }, [catalogs.measures, form.format_id]);

  const availableProducts = useMemo(() => {
    if (!form.third_id) return [];

    return catalogs.products.filter(
      (product) => String(product.third_id) === form.third_id,
    );
  }, [catalogs.products, form.third_id]);

  useEffect(() => {
    if (!selectedProduct) return;

    const nextTroquelId = selectedProduct.troquel_id
      ? String(selectedProduct.troquel_id)
      : "";

    setForm((prev) =>
      prev.troquel_id === nextTroquelId
        ? prev
        : { ...prev, troquel_id: nextTroquelId },
    );
  }, [selectedProduct]);

  useEffect(() => {
    if (!unitsPerSheet) return;

    setForm((prev) => {
      if (prev.calculation_mode === "TOTAL_REQUIRED") {
        const normalizedTotal = normalizePositiveInteger(prev.total_estimated);
        const nextAmountSheets = normalizedTotal
          ? String(Math.ceil(normalizedTotal / unitsPerSheet))
          : "";

        return prev.amount_sheets === nextAmountSheets
          ? prev
          : { ...prev, amount_sheets: nextAmountSheets };
      }

      const normalizedAmountSheets = normalizePositiveInteger(
        prev.amount_sheets,
      );
      const nextTotalEstimated = normalizedAmountSheets
        ? String(normalizedAmountSheets * unitsPerSheet)
        : "";

      return prev.total_estimated === nextTotalEstimated
        ? prev
        : { ...prev, total_estimated: nextTotalEstimated };
    });
  }, [unitsPerSheet]);

  const handleCalculationModeChange = (mode) => {
    setForm((prev) => {
      if (prev.calculation_mode === mode) return prev;

      if (!unitsPerSheet) {
        return { ...prev, calculation_mode: mode };
      }

      if (mode === "TOTAL_REQUIRED") {
        const normalizedTotal = normalizePositiveInteger(prev.total_estimated);
        return {
          ...prev,
          calculation_mode: mode,
          amount_sheets: normalizedTotal
            ? String(Math.ceil(normalizedTotal / unitsPerSheet))
            : "",
        };
      }

      const normalizedAmountSheets = normalizePositiveInteger(
        prev.amount_sheets,
      );
      return {
        ...prev,
        calculation_mode: mode,
        total_estimated: normalizedAmountSheets
          ? String(normalizedAmountSheets * unitsPerSheet)
          : "",
      };
    });
  };

  const handleAmountSheetsChange = (value) => {
    setForm((prev) => ({
      ...prev,
      calculation_mode: "SHEETS_REQUIRED",
      amount_sheets: value,
      total_estimated:
        unitsPerSheet && normalizePositiveInteger(value)
          ? String(normalizePositiveInteger(value) * unitsPerSheet)
          : "",
    }));

    if (errors.amount_sheets || errors.total_estimated) {
      setErrors((prev) => ({
        ...prev,
        amount_sheets: "",
        total_estimated: "",
      }));
    }
  };

  const handleTotalEstimatedChange = (value) => {
    setForm((prev) => ({
      ...prev,
      calculation_mode: "TOTAL_REQUIRED",
      total_estimated: value,
      amount_sheets:
        unitsPerSheet && normalizePositiveInteger(value)
          ? String(Math.ceil(normalizePositiveInteger(value) / unitsPerSheet))
          : "",
    }));

    if (errors.amount_sheets || errors.total_estimated) {
      setErrors((prev) => ({
        ...prev,
        amount_sheets: "",
        total_estimated: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOrderLocked) {
      toast.error("La orden ya tiene procesos iniciados y no se puede editar");
      return;
    }
    if (!validate()) return;

    const payload = {
      calculation_mode: form.calculation_mode,
      amount_sheets: Number(form.amount_sheets),
      cavities: Number(form.cavities),
      total_estimated: Number(form.total_estimated),
      measure_id: Number(form.measure_id),
      paper_type_id: Number(form.paper_type_id),
      troquel_id: Number(form.troquel_id),
      product_id: Number(form.product_id),
      processes: form.processes.map(Number),
    };

    try {
      setLoading(true);
      if (isEditing) {
        await ordersService.update(id, payload);
        toast.success("Orden actualizada exitosamente");
        navigate(`/ordenes/${id}`);
      } else {
        const result = await ordersService.create(payload);
        toast.success("Orden creada exitosamente");
        navigate(`/ordenes/${result?.data?.id || ""}`);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo guardar la orden",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f3f7a_0%,#13529a_55%,#2b6cb0_100%)] px-6 py-7 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-100">
              Orden de producción
            </p>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Editar Orden" : "Nueva Orden"}
            </h1>
            <p className="max-w-2xl text-sm text-blue-100">
              Configura la orden base y el flujo de procesos que se diligenciará
              luego en planta.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate("/ordenes")}
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border bg-white shadow-sm">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#13529a]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 p-6">
              {isEditing && isOrderLocked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Esta orden ya inició producción. Los datos de entrada quedaron
                  bloqueados y no se pueden modificar.
                </div>
              )}

              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Datos generales
                  </h2>
                  <p className="text-sm text-slate-500">
                    Información principal de la orden.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select
                      value={form.third_id}
                      disabled={isOrderLocked}
                      onValueChange={(value) => {
                        setField("third_id", value);
                        setField("product_id", "");
                        setField("troquel_id", "");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un cliente">
                          {selectedThird
                            ? formatThirdLabel(selectedThird)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Clientes</SelectLabel>
                          {catalogs.thirds.map((third) => (
                            <SelectItem key={third.id} value={String(third.id)}>
                              {formatThirdLabel(third)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.third_id && (
                      <p className="text-xs text-red-500">{errors.third_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Producto</Label>
                    <Select
                      value={form.product_id}
                      disabled={isOrderLocked || !form.third_id}
                      onValueChange={(value) => setField("product_id", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un producto">
                          {selectedProduct
                            ? formatProductLabel(selectedProduct)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Productos</SelectLabel>
                          {availableProducts.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={String(product.id)}
                            >
                              {formatProductLabel(product)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.product_id && (
                      <p className="text-xs text-red-500">
                        {errors.product_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Total requerido</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ej: 1000 unidades"
                      value={form.total_estimated}
                      disabled={
                        isOrderLocked ||
                        form.calculation_mode === "SHEETS_REQUIRED"
                      }
                      onChange={(e) =>
                        handleTotalEstimatedChange(e.target.value)
                      }
                    />
                    <p className="text-xs text-slate-500">
                      {form.calculation_mode === "TOTAL_REQUIRED"
                        ? "Ingresa las unidades pedidas por el cliente."
                        : "Se calcula automáticamente según los pliegos requeridos."}
                    </p>
                    {errors.total_estimated && (
                      <p className="text-xs text-red-500">
                        {errors.total_estimated}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Pliegos requeridos</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ej: 500"
                      value={form.amount_sheets}
                      disabled={
                        isOrderLocked ||
                        form.calculation_mode === "TOTAL_REQUIRED"
                      }
                      onChange={(e) => handleAmountSheetsChange(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      {form.calculation_mode === "SHEETS_REQUIRED"
                        ? "Ingresa la cantidad de pliegos y calculamos el total."
                        : "Se calcula automáticamente según el total requerido."}
                    </p>
                    {errors.amount_sheets && (
                      <p className="text-xs text-red-500">
                        {errors.amount_sheets}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select
                      value={form.format_id}
                      disabled={isOrderLocked}
                      onValueChange={(value) => {
                        setField("format_id", value);
                        setField("measure_id", "");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un formato">
                          {selectedFormat
                            ? formatFormatLabel(selectedFormat)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Formatos</SelectLabel>
                          {catalogs.formats.map((format) => (
                            <SelectItem
                              key={format.id}
                              value={String(format.id)}
                            >
                              {formatFormatLabel(format)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.format_id && (
                      <p className="text-xs text-red-500">{errors.format_id}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tamaño</Label>
                    <Select
                      value={form.measure_id}
                      disabled={isOrderLocked || !form.format_id}
                      onValueChange={(value) => setField("measure_id", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un tamaño">
                          {selectedMeasure
                            ? formatMeasureLabel(selectedMeasure)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tamaños disponibles</SelectLabel>
                          {availableMeasures.map((measure) => (
                            <SelectItem
                              key={measure.id}
                              value={String(measure.id)}
                            >
                              {formatMeasureLabel(measure)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.measure_id && (
                      <p className="text-xs text-red-500">
                        {errors.measure_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Troquel asignado</Label>
                    <Input
                      value={
                        selectedTroquel
                          ? formatTroquelLabel(selectedTroquel)
                          : ""
                      }
                      placeholder="Se asigna automáticamente al seleccionar el producto"
                      disabled
                    />
                    {errors.troquel_id && (
                      <p className="text-xs text-red-500">
                        {errors.troquel_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Cavidades</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ej: 2"
                      value={form.cavities}
                      disabled={isOrderLocked}
                      onChange={(e) => setField("cavities", e.target.value)}
                    />
                    {errors.cavities && (
                      <p className="text-xs text-red-500">{errors.cavities}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Tipo de papel</Label>
                    <Select
                      value={form.paper_type_id}
                      disabled={isOrderLocked}
                      onValueChange={(value) =>
                        setField("paper_type_id", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un tipo de papel">
                          {selectedPaperType
                            ? formatPaperTypeLabel(selectedPaperType)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tipos de papel</SelectLabel>
                          {catalogs.paperTypes.map((paperType) => (
                            <SelectItem
                              key={paperType.id}
                              value={String(paperType.id)}
                            >
                              {formatPaperTypeLabel(paperType)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.paper_type_id && (
                      <p className="text-xs text-red-500">
                        {errors.paper_type_id}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 md:col-span-2">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Formato base
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {selectedFormat?.name || "Selecciona un formato"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Divisiones del pliego
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {selectedMeasure ? sheetDivisions : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Unidades por pliego
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {unitsPerSheet || "-"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Fórmula aplicada: divisiones del pliego × cavidades del
                      troquel.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t pt-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Flujo de procesos
                  </h2>
                  <p className="text-sm text-slate-500">
                    Selecciona las etapas por las que pasará la orden.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {catalogs.processes.map((process) => {
                    const checked = form.processes.includes(String(process.id));
                    return (
                      <label
                        key={process.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                          checked
                            ? "border-[#13529a] bg-[#13529a]/5"
                            : "border-gray-200 hover:border-[#13529a]/40"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={isOrderLocked}
                          onCheckedChange={(value) =>
                            toggleProcess(String(process.id), Boolean(value))
                          }
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {process.name}
                            </p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {process.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Paso {process.order} ·{" "}
                            {process.field_definitions?.length || 0} campos
                            configurables
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {errors.processes && (
                  <p className="text-xs text-red-500">{errors.processes}</p>
                )}
              </section>

              <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/ordenes")}
                  disabled={loading}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isOrderLocked}
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
                      {isEditing ? "Actualizar orden" : "Crear orden"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Resumen del flujo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Esto ayuda a validar antes de crear la orden.
            </p>

            <div className="mt-4 space-y-3">
              {selectedProcesses.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
                  Todavía no has seleccionado procesos.
                </div>
              ) : (
                selectedProcesses.map((process) => (
                  <div key={process.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {process.name}
                      </p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                        Paso {process.order}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {process.category}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(process.field_definitions || []).length > 0 ? (
                        process.field_definitions.map((field) => (
                          <span
                            key={field.id}
                            className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-600"
                          >
                            {field.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin campos configurables
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OrderForm;
