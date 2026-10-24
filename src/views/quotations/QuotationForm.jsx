import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import quotationsService from "@/services/quotations.service";
import serviceLinesService from "@/services/service_lines.service";
import thirdsService from "@/services/thirds.service";
import paperTypesService from "@/services/paper_types.service";
import formatsService from "@/services/formats.service";
import measuresService from "@/services/measures.service";
import { calculateOffsetQuotation } from "@/lib/quotationCosting";
import { formatCOP } from "@/lib/currency";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";

const emptyCostos = () => ({
  diseno: "0",
  troquel: "0",
  acabados: "0",
  corte: "0",
  pegado: "0",
  troqueladoMillar: "0",
  plastificadoMillar: "0",
});

const emptyItem = () => ({
  descripcionProducto: "",
  cantidad: "",
  cavidad: "1",
  tintas: "1",
  paperTypeId: "",
  supplierThirdId: "",
  formatId: "",
  measureId: "",
  porcentajeGanancia: "",
  costos: emptyCostos(),
});

const thirdLabel = (t) => t?.company_name || t?.name || `Cliente #${t?.id}`;
const paperLabel = (p) =>
  p?.grammage ? `${p.name} - ${p.grammage} gr` : p?.name || "Papel";
const supplierLabel = (s) =>
  `${s.third?.company_name || s.third?.name || `#${s.third_id}`} — ${formatCOP(
    s.purchase_price,
  )}`;
const measureLabel = (m) => `${m.width} x ${m.height}`;
const num = (v) => (v === "" || v == null ? 0 : Number(v));

// Máscara de moneda (COP entero): el valor guardado son dígitos crudos
// ("15000"); en pantalla se muestra con separadores de miles ("15.000").
const milesFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const onlyDigits = (v) => String(v ?? "").replace(/\D/g, "");
const formatMiles = (v) => {
  const digits = onlyDigits(v);
  return digits === "" ? "" : milesFmt.format(Number(digits));
};

// Suma de todos los costos (fijos + por millar) de un ítem. Debe ser > 0.
const costosSum = (it) =>
  Object.values(it.costos || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);

// Algún campo de costo vacío (deben estar los 7 diligenciados; 0 es válido).
const someCostoEmpty = (it) =>
  Object.values(it.costos || {}).some((v) => v === "" || v == null);

// Un ítem es inválido si deja algún costo vacío o si la suma queda en 0.
const costosItemInvalid = (it) => someCostoEmpty(it) || costosSum(it) <= 0;

// Errores por campo del producto (todos obligatorios).
const itemFieldErrors = (it) => {
  const e = {};
  if (!it.descripcionProducto.trim()) e.descripcionProducto = "Obligatorio";
  if (!it.paperTypeId) e.paperTypeId = "Selecciona un papel";
  if (!it.supplierThirdId) e.supplierThirdId = "Selecciona el proveedor";
  if (!it.formatId) e.formatId = "Selecciona un formato";
  if (!it.measureId) e.measureId = "Selecciona un tamaño";
  const cavidad = Number(it.cavidad);
  if (!Number.isInteger(cavidad) || cavidad < 1) e.cavidad = "Inválida";
  const tintas = Number(it.tintas);
  if (!Number.isInteger(tintas) || tintas < 0 || tintas > 4)
    e.tintas = "De 0 a 4 (0 = sin impresión)";
  const cantidad = Number(it.cantidad);
  if (!Number.isFinite(cantidad) || cantidad < 200)
    e.cantidad = "Mínimo 200 unidades";
  const pct = Number(it.porcentajeGanancia);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100)
    e.porcentajeGanancia = "Entre 1% y 100%";
  return e;
};

// Un ítem es inválido si algún campo tiene error o los costos no son válidos.
const itemInvalid = (it) =>
  Object.keys(itemFieldErrors(it)).length > 0 || costosItemInvalid(it);

const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  // Los errores rojos solo se muestran tras intentar guardar (no por defecto).
  const [showErrors, setShowErrors] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [catalogs, setCatalogs] = useState({
    serviceLines: [],
    thirds: [],
    paperTypes: [],
    formats: [],
    measures: [],
  });

  const [form, setForm] = useState({
    serviceLineId: "",
    clientKind: "EXISTING",
    thirdId: "",
    contact: { name: "", company: "", email: "", phone: "" },
    // Arranca SIN productos: las tarjetas aparecen al "Agregar producto".
    items: [],
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setFetching(true);
      const [linesRes, thirdsRes, papersRes, formatsRes, measuresRes, qRes] =
        await Promise.all([
          serviceLinesService.getAll({ onlyActive: true }),
          thirdsService.getAll({
            onlyActive: true,
            typePerson: "CLIENTE",
            pageSize: 1000,
          }),
          paperTypesService.getAll({ onlyActive: true, pageSize: 1000 }),
          formatsService.getAll({ onlyActive: true }),
          measuresService.getAll({ onlyActive: true }),
          isEditing ? quotationsService.getById(id) : Promise.resolve(null),
        ]);

      setCatalogs({
        serviceLines: linesRes?.data || [],
        thirds: thirdsRes?.data?.thirds || thirdsRes?.data || [],
        paperTypes: papersRes?.data || [],
        formats: formatsRes?.data || [],
        measures: measuresRes?.data || [],
      });

      const quotation = qRes?.data;
      if (quotation) {
        if (quotation.status !== "BORRADOR") {
          toast.error("Solo se puede editar una cotización en borrador");
          navigate("/cotizaciones");
          return;
        }
        setForm({
          serviceLineId: String(quotation.serviceLine?.id || ""),
          clientKind: quotation.client?.kind || "EXISTING",
          thirdId: quotation.client?.thirdId
            ? String(quotation.client.thirdId)
            : "",
          contact: {
            name: quotation.client?.contact?.name || "",
            company: quotation.client?.contact?.company || "",
            email: quotation.client?.contact?.email || "",
            phone: quotation.client?.contact?.phone || "",
          },
          items: (quotation.items || []).map((it) => {
            // El % de ganancia no se persiste: se deriva del costing congelado.
            const sub = it.costing?.subtotalCostos || 0;
            const total = it.costing?.totalCotizar || 0;
            const pct = sub > 0 ? Math.round(((total - sub) / sub) * 100) : "";
            return {
              descripcionProducto: it.descripcionProducto || "",
              cantidad: String(it.cantidad ?? ""),
              cavidad: String(it.cavidad ?? "1"),
              tintas: String(it.tintas ?? "1"),
              paperTypeId: it.papel?.paperTypeId
                ? String(it.papel.paperTypeId)
                : "",
              supplierThirdId: it.papel?.supplierThirdId
                ? String(it.papel.supplierThirdId)
                : "",
              formatId: it.formato?.formatId ? String(it.formato.formatId) : "",
              measureId: it.medida?.measureId
                ? String(it.medida.measureId)
                : "",
              porcentajeGanancia: String(pct),
              costos: {
                diseno: String(it.costosManuales?.diseno ?? 0),
                troquel: String(it.costosManuales?.troquel ?? 0),
                acabados: String(it.costosManuales?.acabados ?? 0),
                corte: String(it.costosManuales?.corte ?? 0),
                pegado: String(it.costosManuales?.pegado ?? 0),
                troqueladoMillar: String(
                  it.costosManuales?.troqueladoMillar ?? 0,
                ),
                plastificadoMillar: String(
                  it.costosManuales?.plastificadoMillar ?? 0,
                ),
              },
            };
          }),
        });
      }
    } catch {
      toast.error("Error al cargar la información");
      navigate("/cotizaciones");
    } finally {
      setFetching(false);
    }
  };

  const lineId = form.serviceLineId ? Number(form.serviceLineId) : null;

  // Encabezado completo: línea + cliente (existente elegido o prospecto con nombre).
  const headerComplete =
    Boolean(form.serviceLineId) &&
    (form.clientKind === "EXISTING"
      ? Boolean(form.thirdId)
      : Boolean(form.contact.name.trim()));

  // Un producto es válido cuando todos sus campos y costos están correctos.
  const anyItemInvalid = form.items.some(itemInvalid);
  const canSubmit =
    !loading && headerComplete && form.items.length > 0 && !anyItemInvalid;

  const availableClients = useMemo(() => {
    if (!lineId) return [];
    return catalogs.thirds.filter(
      (t) =>
        t.is_active !== false &&
        (t.service_lines || []).some((l) => l.id === lineId),
    );
  }, [catalogs.thirds, lineId]);

  const availablePapers = useMemo(() => {
    if (!lineId) return [];
    return catalogs.paperTypes.filter(
      (p) =>
        p.is_active !== false &&
        Number(p.service_line_id ?? p.service_line?.id) === lineId,
    );
  }, [catalogs.paperTypes, lineId]);

  const selectedClient = useMemo(
    () => catalogs.thirds.find((t) => String(t.id) === form.thirdId) || null,
    [catalogs.thirds, form.thirdId],
  );

  const setItem = (index, patch) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, ...patch } : it,
      ),
    }));

  const setItemCosto = (index, key, value) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, costos: { ...it.costos, [key]: value } } : it,
      ),
    }));

  const addItem = () =>
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (index) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

  const onLineChange = (value) =>
    setForm((prev) => ({
      ...prev,
      serviceLineId: value,
      thirdId: "",
      // Reiniciar papel/proveedor de cada ítem (dependen de la línea).
      items: prev.items.map((it) => ({
        ...it,
        paperTypeId: "",
        supplierThirdId: "",
      })),
    }));

  // Costeo en vivo por ítem.
  const costingByItem = useMemo(() => {
    return form.items.map((it) => {
      const format = catalogs.formats.find((f) => String(f.id) === it.formatId);
      const paper = availablePapers.find(
        (p) => String(p.id) === it.paperTypeId,
      );
      const supplier = paper?.suppliers?.find(
        (s) => String(s.third_id) === it.supplierThirdId,
      );
      const precioPapel = supplier ? Number(supplier.purchase_price) : null;
      if (!format || precioPapel == null) return null;
      return calculateOffsetQuotation({
        cantidad: num(it.cantidad),
        divisiones: format.sheet_divisions,
        cavidad: num(it.cavidad),
        precioPapel,
        tintas: num(it.tintas),
        porcentajeGanancia: num(it.porcentajeGanancia),
        costos: it.costos,
      });
    });
  }, [form.items, catalogs.formats, availablePapers]);

  // Gran total a cobrar al cliente = Σ (valor unitario × cantidad) por producto.
  const granTotal = useMemo(
    () =>
      costingByItem.reduce((acc, c, i) => {
        if (!c) return acc;
        return acc + c.valorUnitario * (Number(form.items[i].cantidad) || 0);
      }, 0),
    [costingByItem, form.items],
  );

  const buildPayload = () => ({
    serviceLineId: Number(form.serviceLineId),
    client:
      form.clientKind === "EXISTING"
        ? { kind: "EXISTING", thirdId: Number(form.thirdId) }
        : { kind: "PROSPECT", contact: form.contact },
    items: form.items.map((it) => ({
      descripcionProducto: it.descripcionProducto.trim(),
      cantidad: num(it.cantidad),
      cavidad: num(it.cavidad),
      tintas: num(it.tintas),
      paperTypeId: Number(it.paperTypeId),
      supplierThirdId: Number(it.supplierThirdId),
      formatId: Number(it.formatId),
      measureId: it.measureId ? Number(it.measureId) : null,
      porcentajeGanancia: num(it.porcentajeGanancia),
      costos: {
        diseno: num(it.costos.diseno),
        troquel: num(it.costos.troquel),
        acabados: num(it.costos.acabados),
        corte: num(it.costos.corte),
        pegado: num(it.costos.pegado),
        troqueladoMillar: num(it.costos.troqueladoMillar),
        plastificadoMillar: num(it.costos.plastificadoMillar),
      },
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // A partir del primer intento, se muestran los errores en rojo.
    setShowErrors(true);
    if (!form.serviceLineId) return toast.error("Selecciona una línea");
    if (form.clientKind === "EXISTING" && !form.thirdId)
      return toast.error("Selecciona un cliente");
    if (form.clientKind === "PROSPECT" && !form.contact.name.trim())
      return toast.error("El prospecto requiere al menos un nombre");
    if (form.items.length === 0)
      return toast.error("Agrega al menos un producto");
    if (anyItemInvalid)
      return toast.error("Revisa los campos marcados en los productos");

    try {
      setLoading(true);
      const payload = buildPayload();
      if (isEditing) {
        await quotationsService.update(id, payload);
        toast.success("Cotización actualizada");
      } else {
        await quotationsService.create(payload);
        toast.success("Cotización creada");
      }
      navigate("/cotizaciones");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-[#13529a]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">
            {isEditing ? "Editar Cotización" : "Nueva Cotización"}
          </h1>
          <p className="text-sm text-gray-500">Los precios van antes de IVA.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/cotizaciones")}
          className="cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" />
          Volver
        </Button>
      </div>

      {/* Encabezado: línea + cliente */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">
              Línea <span className="text-red-500">*</span>
            </Label>
            <Select value={form.serviceLineId} onValueChange={onLineChange}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="Selecciona una línea">
                  {catalogs.serviceLines.find(
                    (l) => String(l.id) === form.serviceLineId,
                  )?.name || null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Líneas de servicio</SelectLabel>
                  {catalogs.serviceLines.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tipo de cliente</Label>
            <div className="flex gap-2">
              {["EXISTING", "PROSPECT"].map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, clientKind: kind }))}
                  className={`h-9 flex-1 cursor-pointer rounded-lg border text-sm ${
                    form.clientKind === kind
                      ? "border-[#13529a] bg-[#13529a]/5 font-medium text-[#13529a]"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {kind === "EXISTING" ? "Existente" : "Prospecto"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {form.clientKind === "EXISTING" ? (
            <div className="space-y-1">
              <Label className="text-xs">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Combobox
                items={availableClients}
                itemToStringValue={(t) => thirdLabel(t)}
                value={selectedClient ?? null}
                disabled={!form.serviceLineId}
                onValueChange={(t) =>
                  setForm((p) => ({ ...p, thirdId: t ? String(t.id) : "" }))
                }
              >
                <ComboboxInput
                  placeholder={
                    form.serviceLineId
                      ? "Buscar cliente..."
                      : "Primero selecciona una línea"
                  }
                  showClear
                />
                <ComboboxContent>
                  <ComboboxEmpty>No hay clientes en esta línea.</ComboboxEmpty>
                  <ComboboxList>
                    {(t) => (
                      <ComboboxItem key={t.id} value={thirdLabel(t)}>
                        {thirdLabel(t)}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["name", "Nombre *"],
                ["company", "Empresa"],
                ["email", "Email"],
                ["phone", "Teléfono"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    className="h-9 text-sm"
                    value={form.contact[key]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        contact: { ...p.contact, [key]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Productos */}
      <section className="space-y-4" id="products-section">
        {form.items.map((it, index) => {
          const costing = costingByItem[index];
          // Solo se muestran los errores después de intentar guardar.
          const costosInvalid = showErrors && costosItemInvalid(it);
          const err = showErrors ? itemFieldErrors(it) : {};
          const paper = availablePapers.find(
            (p) => String(p.id) === it.paperTypeId,
          );
          const measuresForFormat = catalogs.measures.filter(
            (m) => String(m.format_id) === it.formatId,
          );
          return (
            <div
              key={index}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">
                  Producto No. <span className="text-red-700">{index + 1}</span>
                </p>
                {
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                }
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descripción del producto</Label>
                <Input
                  className={`h-9 text-sm ${
                    err.descripcionProducto ? "border-red-400" : ""
                  }`}
                  placeholder="Ej: Caja 20x15x5, Full Color 4x0, Papel Eco"
                  value={it.descripcionProducto}
                  onChange={(e) =>
                    setItem(index, { descripcionProducto: e.target.value })
                  }
                />
                {err.descripcionProducto && (
                  <p className="text-xs text-red-500">
                    {err.descripcionProducto}
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Papel</Label>
                  <Select
                    value={it.paperTypeId}
                    disabled={!form.serviceLineId}
                    onValueChange={(v) =>
                      setItem(index, { paperTypeId: v, supplierThirdId: "" })
                    }
                  >
                    <SelectTrigger
                      className={`h-9 w-full text-sm ${
                        err.paperTypeId ? "border-red-400" : ""
                      }`}
                    >
                      <SelectValue placeholder="Selecciona un papel">
                        {paper ? paperLabel(paper) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availablePapers.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {paperLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err.paperTypeId && (
                    <p className="text-xs text-red-500">{err.paperTypeId}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Proveedor (precio)</Label>
                  <Select
                    value={it.supplierThirdId}
                    disabled={!it.paperTypeId}
                    onValueChange={(v) =>
                      setItem(index, { supplierThirdId: v })
                    }
                  >
                    <SelectTrigger
                      className={`h-9 w-full text-sm ${
                        err.supplierThirdId ? "border-red-400" : ""
                      }`}
                    >
                      <SelectValue placeholder="Proveedor del papel">
                        {(() => {
                          const s = paper?.suppliers?.find(
                            (x) => String(x.third_id) === it.supplierThirdId,
                          );
                          return s ? supplierLabel(s) : null;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(paper?.suppliers || []).map((s) => (
                        <SelectItem key={s.third_id} value={String(s.third_id)}>
                          {supplierLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err.supplierThirdId && (
                    <p className="text-xs text-red-500">
                      {err.supplierThirdId}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Formato</Label>
                  <Select
                    value={it.formatId}
                    onValueChange={(v) =>
                      setItem(index, { formatId: v, measureId: "" })
                    }
                  >
                    <SelectTrigger
                      className={`h-9 w-full text-sm ${
                        err.formatId ? "border-red-400" : ""
                      }`}
                    >
                      <SelectValue placeholder="Formato">
                        {catalogs.formats.find(
                          (f) => String(f.id) === it.formatId,
                        )?.name || null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {catalogs.formats.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err.formatId && (
                    <p className="text-xs text-red-500">{err.formatId}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tamaño</Label>
                  <Select
                    value={it.measureId}
                    disabled={!it.formatId}
                    onValueChange={(v) => setItem(index, { measureId: v })}
                  >
                    <SelectTrigger
                      className={`h-9 w-full text-sm ${
                        err.measureId ? "border-red-400" : ""
                      }`}
                    >
                      <SelectValue placeholder="Tamaño">
                        {(() => {
                          const m = catalogs.measures.find(
                            (x) => String(x.id) === it.measureId,
                          );
                          return m ? measureLabel(m) : null;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {measuresForFormat.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {measureLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {err.measureId && (
                    <p className="text-xs text-red-500">{err.measureId}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Cavidad</Label>
                  <Input
                    type="number"
                    min="1"
                    className={`h-9 text-sm ${
                      err.cavidad ? "border-red-400" : ""
                    }`}
                    value={it.cavidad}
                    onChange={(e) =>
                      setItem(index, { cavidad: e.target.value })
                    }
                  />
                  {err.cavidad && (
                    <p className="text-xs text-red-500">{err.cavidad}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tintas</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="4"
                      disabled={Number(it.tintas) === 0}
                      className={`h-9 w-16 text-sm disabled:bg-slate-100 ${
                        err.tintas ? "border-red-400" : ""
                      }`}
                      value={it.tintas}
                      onChange={(e) =>
                        setItem(index, { tintas: e.target.value })
                      }
                    />
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#13529a] focus:ring-[#13529a]"
                        checked={Number(it.tintas) === 0}
                        onChange={(e) =>
                          setItem(index, {
                            tintas: e.target.checked ? "0" : "1",
                          })
                        }
                      />
                      Sin impresión
                    </label>
                  </div>
                  {err.tintas && (
                    <p className="text-xs text-red-500">{err.tintas}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cantidad requerida</Label>
                  <Input
                    type="number"
                    min="200"
                    className={`h-9 text-sm ${
                      err.cantidad ? "border-red-400" : ""
                    }`}
                    value={it.cantidad}
                    onChange={(e) =>
                      setItem(index, { cantidad: e.target.value })
                    }
                  />
                  {err.cantidad && (
                    <p className="text-xs text-red-500">{err.cantidad}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">% Ganancia</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    className={`h-9 text-sm ${
                      err.porcentajeGanancia ? "border-red-400" : ""
                    }`}
                    value={it.porcentajeGanancia}
                    onChange={(e) =>
                      setItem(index, { porcentajeGanancia: e.target.value })
                    }
                  />
                  {err.porcentajeGanancia && (
                    <p className="text-xs text-red-500">
                      {err.porcentajeGanancia}
                    </p>
                  )}
                </div>
              </div>

              <div name="costos-box" className="space-y-3 mb-8">
                <FieldSet
                  className={costosInvalid ? "border-red-300 bg-red-50/40" : ""}
                >
                  <FieldLegend variant="label">
                    Costos fijos (una vez)
                  </FieldLegend>
                  <FieldGroup className="grid gap-3 md:grid-cols-5">
                    {[
                      ["diseno", "Diseño"],
                      ["troquel", "Troquel"],
                      ["acabados", "Acabados"],
                      ["corte", "Corte"],
                      ["pegado", "Pegado"],
                    ].map(([key, label]) => {
                      const fieldId = `costo-${index}-${key}`;
                      return (
                        <Field key={key}>
                          <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
                          <InputGroup>
                            <InputGroupAddon>
                              <InputGroupText>$</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              id={fieldId}
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={formatMiles(it.costos[key])}
                              onChange={(e) =>
                                setItemCosto(
                                  index,
                                  key,
                                  onlyDigits(e.target.value),
                                )
                              }
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>COP</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </Field>
                      );
                    })}
                  </FieldGroup>
                </FieldSet>

                <FieldSet
                  className={costosInvalid ? "border-red-300 bg-red-50/40" : ""}
                >
                  <FieldLegend variant="label">
                    Tarifas por millar (costos variables)
                  </FieldLegend>
                  <FieldGroup className="grid gap-3 md:grid-cols-5">
                    <Field>
                      <FieldLabel htmlFor={`costo-${index}-troqueladoMillar`}>
                        Troquelado (por millar)
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>$</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          id={`costo-${index}-troqueladoMillar`}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formatMiles(it.costos.troqueladoMillar)}
                          onChange={(e) =>
                            setItemCosto(
                              index,
                              "troqueladoMillar",
                              onlyDigits(e.target.value),
                            )
                          }
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>COP</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`costo-${index}-plastificadoMillar`}>
                        Plastificado (por millar)
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>$</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          id={`costo-${index}-plastificadoMillar`}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formatMiles(it.costos.plastificadoMillar)}
                          onChange={(e) =>
                            setItemCosto(
                              index,
                              "plastificadoMillar",
                              onlyDigits(e.target.value),
                            )
                          }
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>COP</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </div>
              <Separator />
              {/* Resumen del cálculo en vivo */}
              {costing && (
                <div className="rounded-xl border border-slate-200 bg-blue-50 p-3 mt-8">
                  <h5 className="text-center pt-2 pb-4 font-bold">
                    RESUMEN COSTOS
                  </h5>
                  <div
                    name="summary-cost"
                    className="grid gap-2 text-sm md:grid-cols-4"
                  >
                    <Summary
                      label="Pliegos a comprar"
                      value={costing.pliegos}
                    />

                    <Summary label="Millares" value={costing.millares} />
                    <Summary
                      label="Costo Papel (pliegos)"
                      value={formatCOP(costing.precioPliegos)}
                    />
                    <Summary
                      label="Subtotal Costos"
                      value={formatCOP(costing.subtotalCostos)}
                    />
                    <Summary
                      label="Total"
                      value={formatCOP(costing.totalCotizar)}
                      strong
                    />
                    <Summary
                      label="Ganancia"
                      value={formatCOP(costing.ganancia)}
                      strong
                    />
                    <Summary
                      label="Costo Troquelado"
                      value={formatCOP(costing.troquelado)}
                    />
                    <Summary
                      label="Costo Impresión"
                      value={formatCOP(costing.precioImpresion)}
                    />
                    <Summary
                      label="Costo Planchas"
                      value={formatCOP(costing.precioPlanchas)}
                    />

                    <Summary
                      label="Valor unitario"
                      value={formatCOP(costing.valorUnitario)}
                      strong
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex flex-col items-center justify-center gap-2">
          <Button
            type="button"
            onClick={addItem}
            disabled={!headerComplete}
            className="cursor-pointer py-5 bg-[#13529a] text-white hover:bg-[#0f3f7a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} className="mr-2" />
            Agregar producto
          </Button>
        </div>
      </section>

      {/* Footer */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Total Cotización (antes de IVA)
          </p>
          <p className="text-2xl font-bold text-green-700">
            {formatCOP(granTotal)}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/cotizaciones")}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={`cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a] disabled:cursor-not-allowed ${
              canSubmit ? "" : "opacity-50"
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {isEditing ? "Actualizar" : "Crear"} cotización
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

const Summary = ({ label, value, strong = false }) => (
  <div>
    <p className="text-xs text-slate-500">{label}</p>
    <p
      className={
        strong ? "font-bold text-[#13529a]" : "font-medium text-slate-800"
      }
    >
      {value}
    </p>
  </div>
);

export default QuotationForm;
