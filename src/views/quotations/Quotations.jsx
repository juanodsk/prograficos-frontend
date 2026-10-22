import { Calculator } from "lucide-react";

const Quotations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#13529a]">Cotizaciones</h1>
        <p className="text-sm text-gray-500">
          Cotizaciones internas de productos para clientes.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
        <div className="rounded-2xl bg-[#13529a]/10 p-3 text-[#13529a]">
          <Calculator size={28} />
        </div>
        <h2 className="text-base font-semibold text-slate-900">
          Módulo en construcción
        </h2>
        <p className="max-w-md text-sm text-slate-500">
          Aquí vivirán las cotizaciones. Estamos montando la base del módulo
          paso a paso.
        </p>
      </div>
    </div>
  );
};

export default Quotations;
