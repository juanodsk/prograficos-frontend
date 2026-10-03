import { useEffect, useState } from "react";
import { toast } from "sonner";
import roleService from "../../services/role.service";
import DataTable from "../../components/data-table/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Shield, X, Save } from "lucide-react";

const emptyForm = { name: "", label: "", description: "", is_active: true };

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, roleId: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState({
    open: false,
    roleId: null,
    name: "",
    loading: false,
  });

  const isEditing = Boolean(modal.roleId);
  const editingRole = roles.find((r) => r.id === modal.roleId) || null;
  const isSystem = editingRole?.is_system;

  const load = async () => {
    try {
      setLoading(true);
      const res = await roleService.getRoles();
      setRoles(res.data || []);
    } catch {
      toast.error("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setModal({ open: true, roleId: null });
  };

  const openEdit = (role) => {
    setForm({
      name: role.name,
      label: role.label || "",
      description: role.description || "",
      is_active: role.is_active,
    });
    setErrors({});
    setModal({ open: true, roleId: role.id });
  };

  const closeModal = () => {
    if (saving) return;
    setModal({ open: false, roleId: null });
  };

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!isEditing && (!form.name || form.name.length < 3))
      nextErrors.name = "Mínimo 3 caracteres (A-Z 0-9 _)";
    if (!form.label.trim()) nextErrors.label = "La etiqueta es obligatoria";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSaving(true);
      if (isEditing) {
        await roleService.updateRole(modal.roleId, {
          label: form.label.trim(),
          description: form.description.trim() || null,
          is_active: form.is_active,
        });
        toast.success("Rol actualizado");
      } else {
        await roleService.createRole({
          name: form.name,
          label: form.label.trim(),
          description: form.description.trim() || null,
        });
        toast.success("Rol creado");
      }
      setModal({ open: false, roleId: null });
      await load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo guardar el rol",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setConfirm((p) => ({ ...p, loading: true }));
    try {
      await roleService.deleteRole(confirm.roleId);
      toast.success("Rol eliminado");
      setConfirm({ open: false, roleId: null, name: "", loading: false });
      await load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudo eliminar el rol",
      );
      setConfirm((p) => ({ ...p, loading: false }));
    }
  };

  const columns = [
    {
      key: "name",
      label: "Rol",
      render: (row) => (
        <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
          <Shield size={14} className="text-[#13529a]" />
          {row.name}
        </span>
      ),
    },
    { key: "label", label: "Etiqueta" },
    {
      key: "description",
      label: "Descripción",
      render: (row) =>
        row.description ? (
          row.description
        ) : (
          <span className="italic text-gray-500">Sin descripción</span>
        ),
    },
    { key: "users_count", label: "Usuarios" },
    { key: "permissions_count", label: "Permisos" },
    {
      key: "is_system",
      label: "Tipo",
      render: (row) =>
        row.is_system ? (
          <span className="rounded-full bg-[#13529a]/10 px-2 py-1 text-xs font-semibold text-[#13529a]">
            Sistema
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
            Personalizado
          </span>
        ),
    },
    {
      key: "is_active",
      label: "Estado",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.is_active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => openEdit(row)}
        className="cursor-pointer hover:bg-[#13529a]/10 hover:text-[#13529a]"
        title="Editar"
      >
        <Pencil size={16} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={row.is_system || row.users_count > 0}
        onClick={() =>
          !row.is_system &&
          row.users_count === 0 &&
          setConfirm({
            open: true,
            roleId: row.id,
            name: row.label,
            loading: false,
          })
        }
        className={
          row.is_system || row.users_count > 0
            ? "cursor-not-allowed text-gray-300 opacity-50"
            : "cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
        }
        title={
          row.is_system
            ? "Rol de sistema (no se elimina)"
            : row.users_count > 0
              ? `No se puede eliminar: tiene ${row.users_count} usuario(s) asignado(s)`
              : "Eliminar"
        }
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13529a]">Roles</h1>
          <p className="text-sm text-gray-500">
            {roles.length} roles registrados
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a]"
        >
          <Plus size={16} className="mr-2" />
          Nuevo rol
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <DataTable
            data={roles}
            columns={columns}
            actions={actions}
            storageKey="security-roles"
          />
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="h-1.5 w-full bg-[#13529a]" />
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-base font-bold text-[#13529a]">
                {isEditing ? "Editar rol" : "Nuevo rol"}
              </h2>
              <button
                onClick={closeModal}
                className="cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 p-5">
              <div className="space-y-1">
                <Label className="text-xs">Nombre interno</Label>
                <Input
                  value={form.name}
                  disabled={isEditing}
                  placeholder="EJ: FACTURACION"
                  onChange={(e) => {
                    const clean = e.target.value
                      .toUpperCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^A-Z0-9_]/g, "");
                    setForm((p) => ({ ...p, name: clean }));
                    if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                  }}
                  className="h-9 text-sm uppercase"
                />
                <p className="text-[11px] text-slate-400">
                  Identificador fijo en mayúsculas (no se puede cambiar
                  después).
                </p>
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Etiqueta</Label>
                <Input
                  value={form.label}
                  placeholder="Ej: Facturación"
                  onChange={(e) => {
                    setForm((p) => ({ ...p, label: e.target.value }));
                    if (errors.label) setErrors((p) => ({ ...p, label: "" }));
                  }}
                  className="h-9 text-sm"
                />
                {errors.label && (
                  <p className="text-xs text-red-500">{errors.label}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descripción (opcional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="h-9 text-sm"
                />
              </div>

              {isEditing && !isSystem && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, is_active: !p.is_active }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.is_active ? "bg-[#13529a]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    {form.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              )}

              <div className="flex gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-9 flex-1 cursor-pointer text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 flex-1 cursor-pointer bg-[#13529a] text-sm text-white hover:bg-[#0f3f7a]"
                >
                  {saving ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={14} className="mr-2" />
                  )}
                  {isEditing ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() =>
          !confirm.loading &&
          setConfirm({ open: false, roleId: null, name: "", loading: false })
        }
        onConfirm={confirmDelete}
        loading={confirm.loading}
        title="¿Eliminar rol?"
        description={`Vas a eliminar el rol "${confirm.name}". Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
