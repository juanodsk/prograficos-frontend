import { useCallback, useEffect, useMemo, useState } from "react";
import thirdsService from "../../services/thirds.service";
import ProductForm from "../products/ProductForm";
import ProductView from "../products/ProductView";
import DataTable from "../../components/data-table/DataTable";
import {
  Loader2,
  Mail,
  User,
  Shield,
  IdCard,
  MapPin,
  Building2,
  X,
  Package,
  Plus,
  ScanEye,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getDocumentTypeLabel,
  getPersonTypeLabel,
  getThirdTypeLabel,
} from "@/constants/thirds";

const sizeConfig = {
  SMALL: {
    label: "Pequeño",
    className: "bg-blue-100 text-blue-800",
  },
  MEDIUM: {
    label: "Mediano",
    className: "bg-red-100 text-red-800",
  },
  LARGE: {
    label: "Grande",
    className: "bg-green-100 text-green-800",
  },
};

const formatTroquelLabel = (troquel) => {
  if (!troquel) return "Troquel sin asignar";
  return troquel.code || troquel.file_name || `Troquel #${troquel.id}`;
};

const formatTroquelSize = (size) =>
  sizeConfig[size]?.label || size || "Sin tamaño";

const getTabButtonClassName = (isActive) =>
  `shrink-0 min-w-[120px] rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-semibold transition-colors ${
    isActive
      ? "bg-white text-[#13529a] shadow-sm"
      : "border-transparent bg-transparent text-slate-500 hover:bg-white/60 hover:text-[#13529a]"
  }`;

const ThirdView = ({ isOpen, onClose, thirdId }) => {
  const [loading, setLoading] = useState(false);
  const [third, setThird] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [productForm, setProductForm] = useState({
    isOpen: false,
    productId: null,
  });
  const [productView, setProductView] = useState({
    isOpen: false,
    productId: null,
  });

  const fetchThird = useCallback(async () => {
    if (!thirdId || !isOpen) return;

    try {
      setLoading(true);
      const response = await thirdsService.getById(thirdId);
      setThird(response?.data?.third || response);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el tercero");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [isOpen, onClose, thirdId]);

  useEffect(() => {
    fetchThird();
  }, [fetchThird]);

  useEffect(() => {
    if (!isOpen) {
      setThird(null);
      setActiveTab("info");
      setProductForm({ isOpen: false, productId: null });
      setProductView({ isOpen: false, productId: null });
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveTab("info");
  }, [thirdId]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const fields = useMemo(
    () =>
      third
        ? [
            { icon: User, label: "Nombre", value: third.name },
            { icon: Mail, label: "Correo electrónico", value: third.email },
            { icon: MapPin, label: "Dirección", value: third.address },
            {
              icon: Shield,
              label: "Tipo de tercero",
              value: getThirdTypeLabel(third.type_person),
            },
            {
              icon: Shield,
              label: "Tipo de persona",
              value: getPersonTypeLabel(third.person_type),
            },
            {
              icon: IdCard,
              label: "Tipo de documento",
              value: getDocumentTypeLabel(third.document_type),
            },
            {
              icon: IdCard,
              label: "Número de documento",
              value: third.document_number,
            },
            { icon: Building2, label: "Empresa", value: third.company_name },
            { icon: IdCard, label: "ID del tercero", value: third.id },
          ].filter((field) => field.value)
        : [],
    [third],
  );

  const isClient = third?.type_person === "CLIENTE";
  const products = third?.products || [];
  const headline = third?.company_name || third?.name || "Tercero sin nombre";
  const productTableData = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        name: product.name || "Producto sin nombre",
        troquel_code: formatTroquelLabel(product.troquel),
        troquel_size: product.troquel?.size || "",
        troquel_size_label: formatTroquelSize(product.troquel?.size),
        troquel_file_name: product.troquel?.file_name || "Sin archivo",
        is_active: product.is_active,
      })),
    [products],
  );

  const productColumns = [
    {
      key: "name",
      label: "Producto",
    },
    {
      key: "troquel_code",
      label: "Código de troquel",
    },
    {
      key: "troquel_size_label",
      label: "Tamaño",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            sizeConfig[row.troquel_size]?.className ||
            "bg-gray-100 text-gray-800"
          }`}
        >
          {row.troquel_size_label}
        </span>
      ),
    },
    {
      key: "troquel_file_name",
      label: "Archivo",
    },
    {
      key: "is_active",
      label: "Estado",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            row.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.is_active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const productActions = (row) => (
    <div className="flex justify-end">
      <Button
        size="icon"
        variant="ghost"
        className="cursor-pointer hover:bg-[#13529a]/10 hover:text-[#13529a]"
        onClick={() =>
          setProductView({
            isOpen: true,
            productId: row.id,
          })
        }
      >
        <ScanEye size={16} />
      </Button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in">
        <div className="h-1.5 w-full bg-[#13529a]" />

        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-[#13529a]">
              Información del tercero
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b bg-slate-50/90 px-4 pt-4 sm:px-6">
          <div className="flex flex-nowrap gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`${getTabButtonClassName(
                activeTab === "info",
              )} cursor-pointer`}
            >
              Información
            </button>
            {isClient && (
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`${getTabButtonClassName(
                  activeTab === "products",
                )} cursor-pointer`}
              >
                Productos
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#13529a]" size={32} />
            </div>
          ) : third ? (
            activeTab === "info" ? (
              <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#13529a]/10">
                      <User size={26} className="text-[#13529a]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {third.name}
                    </h3>
                    <p className="text-sm text-slate-500">{headline}</p>
                    <span className="rounded-full bg-[#13529a]/10 px-3 py-1 text-xs font-medium text-[#13529a]">
                      {getThirdTypeLabel(third.type_person)}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Tipo de persona
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {getPersonTypeLabel(third.person_type)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Documento
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {getDocumentTypeLabel(third.document_type)} ·{" "}
                        {third.document_number}
                      </p>
                    </div>
                  </div>
                </aside>

                <div className="grid gap-3 md:grid-cols-2">
                  {fields.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                    >
                      <Icon size={16} className="shrink-0 text-[#13529a]" />
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="break-words text-sm font-medium text-gray-900">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Productos del cliente
                    </h3>
                    <p className="text-sm text-gray-500">
                      {products.length} producto(s) asociado(s)
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      setProductForm({ isOpen: true, productId: null })
                    }
                    className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a]"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar producto
                  </Button>
                </div>

                {products.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#13529a]/10 text-[#13529a]">
                      <Package size={22} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Este cliente aún no tiene productos asociados
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Crea el primero desde aquí para empezar a centralizar los
                      productos en terceros.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <DataTable
                      data={productTableData}
                      columns={productColumns}
                      actions={productActions}
                      itemLabel="productos"
                      storageKey={`third-products-${third?.id || "detail"}`}
                      showExport={false}
                      searchPlaceholder="Buscar producto..."
                      searchContainerClassName="max-w-[280px]"
                      searchInputClassName="h-10 rounded-xl border-slate-200 bg-white shadow-none"
                      toolbarClassName="px-3 pt-3"
                    />
                  </div>
                )}
              </div>
            )
          ) : (
            <p className="py-6 text-center text-gray-500">
              No se encontró el tercero
            </p>
          )}
        </div>
      </div>

      <ProductForm
        isOpen={productForm.isOpen}
        onClose={() => setProductForm({ isOpen: false, productId: null })}
        onSuccess={fetchThird}
        productId={productForm.productId}
        defaultThirdId={third?.id || null}
        lockThird
      />

      <ProductView
        isOpen={productView.isOpen}
        onClose={() => setProductView({ isOpen: false, productId: null })}
        productId={productView.productId}
      />

      <style>{`
        @keyframes animateIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-in { animation: animateIn 0.18s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ThirdView;
