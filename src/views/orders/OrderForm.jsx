import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ordersService from "@/services/orders.service";
import measuresService from "@/services/measures.service";
import paperTypesService from "@/services/paper_types.service";
import troquelesService from "@/services/troqueles.service";
import productCustomerService from "@/services/product_customer.service";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const formatMeasureLabel = (measure) => {
  if (!measure) return "Medida sin definir";
  const size =
    measure.width && measure.height
      ? `${measure.width} x ${measure.height}`
      : null;
  return size || measure.name || "Medida sin definir";
};

const formatPaperTypeLabel = (paperType) => {
  if (!paperType) return "Tipo de papel sin definir";
  const name = paperType.name || "Papel sin nombre";
  return paperType.grammage ? `${name} - ${paperType.grammage} gr` : name;
};

const formatTroquelLabel = (troquel) => {
  if (!troquel) return "Troquel sin definir";
  return troquel.code || troquel.name || "Troquel sin código";
};

const formatProductCustomerLabel = (productCustomer) => {
  if (!productCustomer) return "Producto del cliente sin definir";
  const customerName =
    productCustomer.third?.name ||
    productCustomer.third_name ||
    productCustomer.client_name;
  const productName =
    productCustomer.name ||
    productCustomer.product?.name ||
    productCustomer.product_name;

  if (customerName && productName) return `${customerName} · ${productName}`;
  if (productName) return productName;
  if (customerName) return customerName;
  return "Producto del cliente sin definir";
};

const OrderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [catalogs, setCatalogs] = useState({
    measures: [],
    paperTypes: [],
    troqueles: [],
    productCustomers: [],
    processes: [],
  });
  const [form, setForm] = useState({
    date_delivery_estimated: "",
    amount_sheets: "",
    total_estimated: "",
    measure_id: "",
    paper_type_id: "",
    troquel_id: "",
    product_customer_id: "",
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
        paperTypesRes,
        troquelesRes,
        productCustomersRes,
        processesRes,
        orderRes,
      ] = await Promise.all([
        measuresService.getAll(),
        paperTypesService.getAll(),
        troquelesService.getAll(),
        productCustomerService.getAll(),
        processesService.getAll(),
        isEditing ? ordersService.getById(id) : Promise.resolve(null),
      ]);

      setCatalogs({
        measures: measuresRes?.data || [],
        paperTypes: paperTypesRes?.data || [],
        troqueles: troquelesRes?.data || [],
        productCustomers: productCustomersRes?.data || [],
        processes: (processesRes?.data || []).sort((a, b) => a.order - b.order),
      });

      if (orderRes?.data) {
        const order = orderRes.data;
        setForm({
          date_delivery_estimated: order.date_delivery_estimated
            ? new Date(order.date_delivery_estimated).toISOString().split("T")[0]
            : "",
          amount_sheets: order.amount_sheets ? String(order.amount_sheets) : "",
          total_estimated: order.total_estimated ? String(order.total_estimated) : "",
          measure_id: order.measure_id ? String(order.measure_id) : "",
          paper_type_id: order.paper_type_id ? String(order.paper_type_id) : "",
          troquel_id: order.troquel_id ? String(order.troquel_id) : "",
          product_customer_id: order.product_customer_id
            ? String(order.product_customer_id)
            : "",
          processes:
            order.detail_production_orders?.map((detail) => String(detail.process_id)) || [],
        });
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
    if (!form.date_delivery_estimated) nextErrors.date_delivery_estimated = "La fecha estimada es obligatoria";
    if (!form.amount_sheets || Number(form.amount_sheets) <= 0) nextErrors.amount_sheets = "La cantidad de hojas debe ser mayor a 0";
    if (!form.total_estimated || Number(form.total_estimated) <= 0) nextErrors.total_estimated = "El total estimado debe ser mayor a 0";
    if (!form.measure_id) nextErrors.measure_id = "Selecciona una medida";
    if (!form.paper_type_id) nextErrors.paper_type_id = "Selecciona un tipo de papel";
    if (!form.troquel_id) nextErrors.troquel_id = "Selecciona un troquel";
    if (!form.product_customer_id) nextErrors.product_customer_id = "Selecciona un producto del cliente";
    if (!form.processes.length) nextErrors.processes = "Selecciona al menos un proceso";
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

  const selectedMeasure = useMemo(
    () =>
      catalogs.measures.find(
        (measure) => String(measure.id) === form.measure_id,
      ) || null,
    [catalogs.measures, form.measure_id],
  );

  const selectedPaperType = useMemo(
    () =>
      catalogs.paperTypes.find(
        (paperType) => String(paperType.id) === form.paper_type_id,
      ) || null,
    [catalogs.paperTypes, form.paper_type_id],
  );

  const selectedTroquel = useMemo(
    () =>
      catalogs.troqueles.find(
        (troquel) => String(troquel.id) === form.troquel_id,
      ) || null,
    [catalogs.troqueles, form.troquel_id],
  );

  const selectedProductCustomer = useMemo(
    () =>
      catalogs.productCustomers.find(
        (productCustomer) =>
          String(productCustomer.id) === form.product_customer_id,
      ) || null,
    [catalogs.productCustomers, form.product_customer_id],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      date_delivery_estimated: form.date_delivery_estimated,
      amount_sheets: Number(form.amount_sheets),
      total_estimated: Number(form.total_estimated),
      measure_id: Number(form.measure_id),
      paper_type_id: Number(form.paper_type_id),
      troquel_id: Number(form.troquel_id),
      product_customer_id: Number(form.product_customer_id),
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
      toast.error(error?.response?.data?.message || "No se pudo guardar la orden");
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
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Datos generales</h2>
                  <p className="text-sm text-slate-500">
                    Información principal de la orden.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha estimada de entrega</Label>
                    <Input
                      type="date"
                      value={form.date_delivery_estimated}
                      onChange={(e) => setField("date_delivery_estimated", e.target.value)}
                    />
                    {errors.date_delivery_estimated && (
                      <p className="text-xs text-red-500">{errors.date_delivery_estimated}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad de hojas</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.amount_sheets}
                      onChange={(e) => setField("amount_sheets", e.target.value)}
                    />
                    {errors.amount_sheets && (
                      <p className="text-xs text-red-500">{errors.amount_sheets}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Total estimado</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.total_estimated}
                      onChange={(e) => setField("total_estimated", e.target.value)}
                    />
                    {errors.total_estimated && (
                      <p className="text-xs text-red-500">{errors.total_estimated}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Medida</Label>
                    <Select value={form.measure_id} onValueChange={(value) => setField("measure_id", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una medida">
                          {selectedMeasure ? formatMeasureLabel(selectedMeasure) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Medidas</SelectLabel>
                          {catalogs.measures.map((measure) => (
                            <SelectItem key={measure.id} value={String(measure.id)}>
                              {formatMeasureLabel(measure)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.measure_id && <p className="text-xs text-red-500">{errors.measure_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de papel</Label>
                    <Select value={form.paper_type_id} onValueChange={(value) => setField("paper_type_id", value)}>
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
                            <SelectItem key={paperType.id} value={String(paperType.id)}>
                              {formatPaperTypeLabel(paperType)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.paper_type_id && <p className="text-xs text-red-500">{errors.paper_type_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Troquel</Label>
                    <Select value={form.troquel_id} onValueChange={(value) => setField("troquel_id", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un troquel">
                          {selectedTroquel ? formatTroquelLabel(selectedTroquel) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Troqueles</SelectLabel>
                          {catalogs.troqueles.map((troquel) => (
                            <SelectItem key={troquel.id} value={String(troquel.id)}>
                              {formatTroquelLabel(troquel)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.troquel_id && <p className="text-xs text-red-500">{errors.troquel_id}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Producto del cliente</Label>
                    <Select
                      value={form.product_customer_id}
                      onValueChange={(value) => setField("product_customer_id", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un producto del cliente">
                          {selectedProductCustomer
                            ? formatProductCustomerLabel(selectedProductCustomer)
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Productos del cliente</SelectLabel>
                          {catalogs.productCustomers.map((productCustomer) => (
                            <SelectItem key={productCustomer.id} value={String(productCustomer.id)}>
                              {formatProductCustomerLabel(productCustomer)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.product_customer_id && (
                      <p className="text-xs text-red-500">{errors.product_customer_id}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t pt-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Flujo de procesos</h2>
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
                          onCheckedChange={(value) =>
                            toggleProcess(String(process.id), Boolean(value))
                          }
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{process.name}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {process.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Paso {process.order} · {process.field_definitions?.length || 0} campos configurables
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
            <h2 className="text-lg font-semibold text-slate-900">Resumen del flujo</h2>
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
                      <p className="font-semibold text-slate-900">{process.name}</p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                        Paso {process.order}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{process.category}</p>

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
