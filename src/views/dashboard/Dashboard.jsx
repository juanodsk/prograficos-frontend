import { useEffect, useState } from "react";
import { toast } from "sonner";
import productsService from "../../services/products.service";
import { Input } from "@/components/ui/input";
import { formatTroquelLabel } from "@/lib/troquel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Package, Search } from "lucide-react";

const minimumSearchLength = 2;

const formatProductLabel = (product) =>
  product?.name || `Producto #${product?.id || ""}`;

const formatThirdLabel = (third) => {
  if (!third) return "Sin cliente asociado";
  return third.company_name || third.name || `Cliente #${third.id}`;
};

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const search = debouncedSearchQuery.trim();

    if (search.length < minimumSearchLength) {
      setProducts([]);
      setSearchedTerm(search);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productsService.getAll({
          search,
          onlyActive: true,
          page: 1,
          pageSize: 1000,
          sortBy: "third",
          sortDirection: "asc",
        });

        if (cancelled) return;

        setProducts(response?.data?.products || []);
        setSearchedTerm(search);
      } catch (error) {
        if (cancelled) return;

        console.error(error);
        toast.error("No se pudieron cargar los productos");
        setProducts([]);
        setSearchedTerm(search);
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
  }, [debouncedSearchQuery]);

  const trimmedQuery = searchQuery.trim();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f7fafd_100%)] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Buscador de troqueles
            </h1>
            <p className="text-sm text-slate-500">
              Consulta productos por cliente, producto o codigo de troquel.
            </p>
          </div>

          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buscar
            </label>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cliente, producto o troquel. Ej. m100"
                className="h-11 rounded-2xl border-slate-200 bg-white pl-10 text-sm"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Tambien acepta codigos de troquel como s3, m100 o l25.
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
                : searchedTerm.length >= minimumSearchLength
                  ? `${products.length} producto(s) encontrado(s) para "${searchedTerm}"`
                  : "Ingresa al menos 2 caracteres para empezar la busqueda"}
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
              Escribe un cliente, producto o codigo de troquel para ver los
              resultados.
            </p>
          </div>
        ) : trimmedQuery.length < minimumSearchLength ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
            Escribe al menos 2 caracteres para hacer una busqueda util.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Package size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No encontramos resultados
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Intenta con otro cliente, producto o codigo de troquel.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-24 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ID
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Producto
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Codigo troquel
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-4 py-3 font-medium text-slate-700">
                      {product.id}
                    </TableCell>
                    <TableCell className="max-w-[320px] px-4 py-3">
                      <span className="block truncate font-medium text-slate-900">
                        {formatProductLabel(product)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[320px] px-4 py-3">
                      <span className="block truncate text-slate-700">
                        {formatThirdLabel(product.third)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#13529a]/10 px-2.5 py-1 text-xs font-semibold text-[#13529a]">
                        {formatTroquelLabel(product.troquel)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
