import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import productsService from "../../services/products.service";
import ProductView from "../products/ProductView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTroquelLabel } from "@/lib/troquel";
import {
  Building2,
  CalendarDays,
  FileText,
  Loader2,
  Package,
  ScanEye,
  Search,
  Scissors,
  Ruler,
} from "lucide-react";

const sizeConfig = {
  SMALL: {
    label: "S",
    className: "bg-blue-100 text-blue-800",
  },
  MEDIUM: {
    label: "M",
    className: "bg-red-100 text-red-800",
  },
  LARGE: {
    label: "L",
    className: "bg-green-100 text-green-800",
  },
};

const formatThirdLabel = (third) => {
  if (!third) return "Sin cliente asociado";
  return third.company_name || third.name || `Cliente #${third.id}`;
};

const formatTroquelSize = (size) =>
  sizeConfig[size]?.label || size || "Sin tamaño";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Sin fecha";

const Dashboard = () => {
  const [customerQuery, setCustomerQuery] = useState("");
  const [debouncedCustomerQuery, setDebouncedCustomerQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchedCustomer, setSearchedCustomer] = useState("");
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    productId: null,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedCustomerQuery(customerQuery.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [customerQuery]);

  useEffect(() => {
    const customer = debouncedCustomerQuery.trim();

    if (customer.length < 2) {
      setProducts([]);
      setSearchedCustomer(customer);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productsService.searchByCustomer(customer);

        if (cancelled) return;

        setProducts(response?.data?.products || []);
        setSearchedCustomer(customer);
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        toast.error("No se pudieron cargar los productos del cliente");
        setProducts([]);
        setSearchedCustomer(customer);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [debouncedCustomerQuery]);

  const trimmedQuery = useMemo(() => customerQuery.trim(), [customerQuery]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f7fafd_100%)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Buscador de troqueles
            </h1>
            <p className="text-sm text-slate-500">
              Busca por cliente y abre el detalle con el ícono de vista.
            </p>
          </div>

          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cliente
            </label>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Ej. Cartones del Norte"
                className="h-11 rounded-2xl border-slate-200 bg-white pl-10 text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Solo busca por nombre de cliente.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Resultados</p>
            <p className="text-xs text-slate-500">
              {loading
                ? "Buscando productos asociados..."
                : searchedCustomer.length >= 2
                  ? `${products.length} producto(s) encontrado(s) para "${searchedCustomer}"`
                  : "Ingresa al menos 2 caracteres para empezar la búsqueda"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 size={34} className="animate-spin text-[#13529a]" />
              <p className="text-sm font-medium">Consultando productos...</p>
            </div>
          </div>
        ) : trimmedQuery.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#13529a]/10 text-[#13529a]">
              <Search size={20} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Listo para buscar
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Escribe el nombre de un cliente para ver sus productos y troqueles
              asociados.
            </p>
          </div>
        ) : trimmedQuery.length < 2 ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
            Escribe al menos 2 caracteres para hacer una búsqueda útil.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Package size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No encontramos productos para ese cliente
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Intenta con otra parte del nombre o verifica cómo está registrado
              el cliente en configuración.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-[#13529a]/10 px-2 py-0.5 text-[11px] font-semibold text-[#13529a]">
                        Producto #{product.id}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          product.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {product.name || "Producto sin nombre"}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Building2 size={14} />
                      {formatThirdLabel(product.third)}
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="outline"
                    className="cursor-pointer rounded-2xl border-slate-200 hover:border-[#13529a] hover:bg-[#13529a]/5 hover:text-[#13529a]"
                    onClick={() =>
                      setViewModal({ isOpen: true, productId: product.id })
                    }
                    title="Ver detalle del producto"
                  >
                    <ScanEye size={18} />
                  </Button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      <Scissors size={13} />
                      Código de troquel
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatTroquelLabel(product.troquel)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      <Ruler size={13} />
                      Tamaño
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        sizeConfig[product.troquel?.size]?.className ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {formatTroquelSize(product.troquel?.size)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      <FileText size={13} />
                      Archivo
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {product.troquel?.file_name || "Sin archivo"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      <CalendarDays size={13} />
                      Fecha elaboración
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(product.troquel?.elaboration_date)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ProductView
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, productId: null })}
        productId={viewModal.productId}
      />
    </div>
  );
};

export default Dashboard;
