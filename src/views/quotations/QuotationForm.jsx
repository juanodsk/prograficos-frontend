import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import quotationsService from "@/services/quotations.service";
import serviceLinesService from "@/services/service_lines.service";
import thirdsService from "@/services/thirds.service";
import paperTypesService from "@/services/paper_types.service";
import formatsService from "@/services/formats.service";
import measuresService from "@/services/measures.service";
import { formatCOP } from "@/lib/currency";
import { getCostingModule } from "./costing";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  ArrowLeft,
  Construction,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

const thirdLabel = (t) => t?.company_name || t?.name || `Cliente #${t?.id}`;

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
        // El módulo de costeo de la línea sabe cómo precargar sus ítems.
        const mod = getCostingModule(quotation.serviceLine?.name);
        setForm({
          serviceLineId: String(quotation.serviceLine?.id || ""),
          clientKind: quotation.client?.kind || "EXISTING",
          thirdId: quotation.client?.thirdId
            ? String(quotation.client.thirdId)
            : "",
          contact: {
            // El nombre del prospecto siempre en MAYÚSCULAS.
            name: (quotation.client?.contact?.name || "").toUpperCase(),
            company: quotation.client?.contact?.company || "",
            email: quotation.client?.contact?.email || "",
            phone: quotation.client?.contact?.phone || "",
          },
          items: mod ? (quotation.items || []).map(mod.prefillItem) : [],
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
  const selectedLine =
    catalogs.serviceLines.find((l) => String(l.id) === form.serviceLineId) ||
    null;
  // Módulo de costeo según la línea (null si aún no está implementado).
  const costingModule = getCostingModule(selectedLine?.name);
  const canCost = Boolean(costingModule);

  // Encabezado completo: línea + cliente (existente elegido o prospecto con nombre).
  const headerComplete =
    Boolean(form.serviceLineId) &&
    (form.clientKind === "EXISTING"
      ? Boolean(form.thirdId)
      : Boolean(form.contact.name.trim()));

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
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, costingModule.emptyItem()],
    }));

  const removeItem = (index) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));

  // Cambiar de línea reinicia cliente y productos (cada línea costea distinto).
  const onLineChange = (value) =>
    setForm((prev) => ({
      ...prev,
      serviceLineId: value,
      thirdId: "",
      items: [],
    }));

  // Costeo en vivo por ítem (lo resuelve el módulo de la línea).
  const costingByItem = useMemo(() => {
    if (!costingModule) return [];
    return form.items.map((it) =>
      costingModule.computeCosting(it, {
        formats: catalogs.formats,
        papers: availablePapers,
      }),
    );
  }, [costingModule, form.items, catalogs.formats, availablePapers]);

  // Gran total a cobrar = Σ (valor unitario × cantidad) por producto.
  const granTotal = useMemo(() => {
    if (!costingModule) return 0;
    return form.items.reduce(
      (acc, it, i) => acc + costingModule.lineTotal(it, costingByItem[i]),
      0,
    );
  }, [costingModule, form.items, costingByItem]);

  const anyItemInvalid =
    !costingModule || form.items.some((it) => !costingModule.isItemValid(it));
  const canSubmit =
    !loading &&
    headerComplete &&
    canCost &&
    form.items.length > 0 &&
    !anyItemInvalid;

  const buildPayload = () => ({
    serviceLineId: Number(form.serviceLineId),
    client:
      form.clientKind === "EXISTING"
        ? { kind: "EXISTING", thirdId: Number(form.thirdId) }
        : { kind: "PROSPECT", contact: form.contact },
    items: form.items.map(costingModule.toPayloadItem),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // A partir del primer intento, se muestran los errores en rojo.
    setShowErrors(true);
    if (!form.serviceLineId) return toast.error("Selecciona una línea");
    if (!canCost)
      return toast.error("El costeo de esta línea aún está en construcción");
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

  const Fields = costingModule?.Fields;

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
                  {selectedLine?.name || null}
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
                        contact: {
                          ...p.contact,
                          // El nombre del prospecto siempre en MAYÚSCULAS.
                          [key]:
                            key === "name"
                              ? e.target.value.toUpperCase()
                              : e.target.value,
                        },
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
        {form.serviceLineId && !canCost ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 py-16 text-center">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Construction size={28} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Sección de costeo en construcción
            </h2>
            <p className="max-w-md text-sm text-slate-500">
              La línea{" "}
              <span className="font-semibold">{selectedLine?.name}</span>{" "}
              todavía no tiene su costeo configurado. Por ahora solo está
              disponible Offset.
            </p>
          </div>
        ) : (
          <>
            {form.items.map((it, index) => (
              <div
                key={index}
                className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">
                    Producto No.{" "}
                    <span className="text-red-700">{index + 1}</span>
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <Fields
                  item={it}
                  index={index}
                  papers={availablePapers}
                  formats={catalogs.formats}
                  measures={catalogs.measures}
                  err={showErrors ? costingModule.fieldErrors(it) : {}}
                  costosInvalid={showErrors && costingModule.costosInvalid(it)}
                  costing={costingByItem[index]}
                  onItem={(patch) => setItem(index, patch)}
                  onCosto={(key, value) => setItemCosto(index, key, value)}
                />
              </div>
            ))}

            <div className="flex flex-col items-center justify-center gap-2">
              <Button
                type="button"
                onClick={addItem}
                disabled={!headerComplete || !canCost}
                className="cursor-pointer bg-[#13529a] py-5 text-white hover:bg-[#0f3f7a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} className="mr-2" />
                Agregar producto
              </Button>
            </div>
          </>
        )}
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

export default QuotationForm;
