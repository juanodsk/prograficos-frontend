import { useState } from "react";
import { AlertTriangle, Pencil, RotateCcw } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCOP } from "@/lib/currency";

const paperLabel = (p) =>
  p?.grammage ? `${p.name} - ${p.grammage} gr` : p?.name || "Papel";
const supplierLabel = (s) =>
  `${s.third?.company_name || s.third?.name || `#${s.third_id}`} — ${formatCOP(
    s.purchase_price,
  )}`;
const measureLabel = (m) => `${m.width} x ${m.height}`;

// Máscara de moneda (COP entero): valor guardado = dígitos crudos; en pantalla
// con separadores de miles ("15.000").
const milesFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const onlyDigits = (v) => String(v ?? "").replace(/\D/g, "");
const formatMiles = (v) => {
  const digits = onlyDigits(v);
  return digits === "" ? "" : milesFmt.format(Number(digits));
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

/**
 * Campos de costeo de un producto para la LÍNEA OFFSET.
 * Presentacional: el estado, el cálculo y la validación los maneja el padre
 * (QuotationForm) a través del adapter de la línea.
 */
export default function OffsetItemFields({
  item,
  index,
  papers,
  formats,
  measures,
  err = {},
  costosInvalid = false,
  costing = null,
  onItem,
  onCosto,
}) {
  const paper = papers.find((p) => String(p.id) === item.paperTypeId);
  const measuresForFormat = measures.filter(
    (m) => String(m.format_id) === item.formatId,
  );

  // Precio final (negociación) sobre el sugerido del motor.
  // Se edita en un borrador local y SOLO se confirma al salir (onBlur/Enter),
  // para no tomar como precio real los valores intermedios al teclear/borrar.
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState("");
  const cantidadN = Number(item.cantidad) || 0;
  const overridden =
    Boolean(costing) &&
    item.valorUnitarioFinal !== "" &&
    Number(item.valorUnitarioFinal) !== costing.valorUnitario;
  const finalUnit =
    item.valorUnitarioFinal !== "" && item.valorUnitarioFinal != null
      ? Number(item.valorUnitarioFinal)
      : costing?.valorUnitario || 0;
  const margenReal = costing
    ? finalUnit * cantidadN - costing.subtotalCostos
    : 0;
  const unitCost =
    costing && cantidadN > 0 ? costing.subtotalCostos / cantidadN : 0;
  const belowCost = Boolean(costing) && finalUnit < unitCost;

  // Abre el inline cargando el borrador con el valor actual (final o sugerido).
  const openPriceEdit = () => {
    setPriceDraft(
      item.valorUnitarioFinal !== "" && item.valorUnitarioFinal != null
        ? String(item.valorUnitarioFinal)
        : String(costing?.valorUnitario ?? ""),
    );
    setEditingPrice(true);
  };

  // Confirma el borrador: vacío o 0 → vuelve al sugerido; si no, el número.
  const commitPrice = () => {
    const digits = onlyDigits(priceDraft);
    onItem({
      valorUnitarioFinal: digits === "" || Number(digits) === 0 ? "" : digits,
    });
    setEditingPrice(false);
  };

  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Descripción del producto</Label>
        <Input
          className={`h-9 text-sm ${
            err.descripcionProducto ? "border-red-400" : ""
          }`}
          placeholder="Ej: Caja 20x15x5, Full Color 4x0, Papel Eco"
          value={item.descripcionProducto}
          onChange={(e) => onItem({ descripcionProducto: e.target.value })}
        />
        {err.descripcionProducto && (
          <p className="text-xs text-red-500">{err.descripcionProducto}</p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Papel</Label>
          <Select
            value={item.paperTypeId}
            onValueChange={(v) =>
              onItem({ paperTypeId: v, supplierThirdId: "" })
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
              {papers.map((p) => (
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
            value={item.supplierThirdId}
            disabled={!item.paperTypeId}
            onValueChange={(v) => onItem({ supplierThirdId: v })}
          >
            <SelectTrigger
              className={`h-9 w-full text-sm ${
                err.supplierThirdId ? "border-red-400" : ""
              }`}
            >
              <SelectValue placeholder="Proveedor del papel">
                {(() => {
                  const s = paper?.suppliers?.find(
                    (x) => String(x.third_id) === item.supplierThirdId,
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
            <p className="text-xs text-red-500">{err.supplierThirdId}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Formato</Label>
          <Select
            value={item.formatId}
            onValueChange={(v) => onItem({ formatId: v, measureId: "" })}
          >
            <SelectTrigger
              className={`h-9 w-full text-sm ${
                err.formatId ? "border-red-400" : ""
              }`}
            >
              <SelectValue placeholder="Formato">
                {formats.find((f) => String(f.id) === item.formatId)?.name ||
                  null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {formats.map((f) => (
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
            value={item.measureId}
            disabled={!item.formatId}
            onValueChange={(v) => onItem({ measureId: v })}
          >
            <SelectTrigger
              className={`h-9 w-full text-sm ${
                err.measureId ? "border-red-400" : ""
              }`}
            >
              <SelectValue placeholder="Tamaño">
                {(() => {
                  const m = measures.find(
                    (x) => String(x.id) === item.measureId,
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
            className={`h-9 text-sm ${err.cavidad ? "border-red-400" : ""}`}
            value={item.cavidad}
            onChange={(e) => onItem({ cavidad: e.target.value })}
          />
          {err.cavidad && <p className="text-xs text-red-500">{err.cavidad}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tintas</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="4"
              disabled={Number(item.tintas) === 0}
              className={`h-9 w-16 text-sm disabled:bg-slate-100 ${
                err.tintas ? "border-red-400" : ""
              }`}
              value={item.tintas}
              onChange={(e) => onItem({ tintas: e.target.value })}
            />
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[#13529a] focus:ring-[#13529a]"
                checked={Number(item.tintas) === 0}
                onChange={(e) =>
                  onItem({ tintas: e.target.checked ? "0" : "1" })
                }
              />
              Sin impresión
            </label>
          </div>
          {err.tintas && <p className="text-xs text-red-500">{err.tintas}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cantidad requerida</Label>
          <Input
            type="number"
            min="200"
            className={`h-9 text-sm ${err.cantidad ? "border-red-400" : ""}`}
            value={item.cantidad}
            onChange={(e) => onItem({ cantidad: e.target.value })}
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
            value={item.porcentajeGanancia}
            onChange={(e) => onItem({ porcentajeGanancia: e.target.value })}
          />
          {err.porcentajeGanancia && (
            <p className="text-xs text-red-500">{err.porcentajeGanancia}</p>
          )}
        </div>
      </div>

      <div name="costos-box" className="mb-8 space-y-3">
        <FieldSet
          className={costosInvalid ? "border-red-300 bg-red-50/40" : ""}
        >
          <FieldLegend variant="label">Costos fijos (una vez)</FieldLegend>
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
                      value={formatMiles(item.costos[key])}
                      onChange={(e) => onCosto(key, onlyDigits(e.target.value))}
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
            {[
              ["troqueladoMillar", "Troquelado (por millar)"],
              ["plastificadoMillar", "Plastificado (por millar)"],
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
                      value={formatMiles(item.costos[key])}
                      onChange={(e) => onCosto(key, onlyDigits(e.target.value))}
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
      </div>

      <Separator />

      {/* Resumen del cálculo en vivo */}
      {costing && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-blue-50 p-3">
          <h5 className="pb-4 pt-2 text-center font-bold">RESUMEN COSTOS</h5>
          <div
            name="summary-cost"
            className="grid gap-2 text-sm md:grid-cols-4"
          >
            <Summary label="Pliegos a comprar" value={costing.pliegos} />
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
            <Summary label="Margen real" value={formatCOP(margenReal)} strong />
            {/* Sugerido: fijo, solo referencia (automático). */}
            <Summary
              label="Valor unitario (sugerido)"
              value={formatCOP(costing.valorUnitario)}
            />
            {/* Precio final al cliente: lo editable (negociación del jefe). */}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-slate-500">Precio final al cliente</p>
                {!editingPrice && (
                  <button
                    type="button"
                    title="Ajustar precio al cliente"
                    onClick={openPriceEdit}
                    className="cursor-pointer text-slate-400 transition-colors hover:text-[#13529a]"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
              {!editingPrice ? (
                <p
                  className={`font-bold ${
                    overridden ? "text-amber-700" : "text-[#13529a]"
                  }`}
                >
                  {formatCOP(finalUnit)}
                  {overridden && (
                    <span className="ml-1 text-xs font-normal">(ajustado)</span>
                  )}
                </p>
              ) : (
                <div className="mt-0.5 flex items-center gap-1">
                  <div className="flex items-center overflow-hidden rounded-md border border-input text-sm focus-within:border-[#13529a]">
                    <span className="bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                      $
                    </span>
                    <input
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      className="w-20 px-1.5 py-0.5 text-sm outline-none"
                      value={formatMiles(priceDraft)}
                      onChange={(e) => setPriceDraft(onlyDigits(e.target.value))}
                      onBlur={commitPrice}
                      onKeyDown={(e) => {
                        // Enter NO envía la cotización: confirma y cierra.
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitPrice();
                        }
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    title="Volver al sugerido"
                    // onMouseDown evita el blur (que confirmaría el borrador)
                    // antes de resetear al sugerido.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onItem({ valorUnitarioFinal: "" });
                      setEditingPrice(false);
                    }}
                    className="cursor-pointer text-slate-400 hover:text-[#13529a]"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {belowCost && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700">
              <AlertTriangle size={13} />
              El precio final está por debajo del costo unitario (
              {formatCOP(Math.round(unitCost))}).
            </p>
          )}
        </div>
      )}
    </>
  );
}
