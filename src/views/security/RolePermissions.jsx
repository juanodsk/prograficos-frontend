import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import roleService from "../../services/role.service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Loader2, Save, ShieldCheck, KeyRound } from "lucide-react";

export default function RolePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleId, setRoleId] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [loadingRole, setLoadingRole] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRole = roles.find((r) => String(r.id) === roleId) || null;
  const isAdminRole = selectedRole?.name === "ADMIN";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [rolesRes, permsRes] = await Promise.all([
          roleService.getRoles(),
          roleService.getPermissions(),
        ]);
        setRoles(rolesRes.data || []);
        setPermissions(permsRes.data || []);
      } catch {
        toast.error("Error al cargar roles y permisos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadRolePermissions = async (id) => {
    try {
      setLoadingRole(true);
      const res = await roleService.getRole(id);
      setSelected(new Set(res.data?.permission_ids || []));
    } catch {
      toast.error("Error al cargar los permisos del rol");
    } finally {
      setLoadingRole(false);
    }
  };

  const onSelectRole = (value) => {
    setRoleId(value);
    loadRolePermissions(Number(value));
  };

  // Permisos agrupados por módulo.
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of permissions) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module).push(p);
    }
    return [...map.entries()];
  }, [permissions]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleModule = (mods, allChecked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      mods.forEach((p) => (allChecked ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  };

  const save = async () => {
    if (!roleId || isAdminRole) return;
    try {
      setSaving(true);
      await roleService.updateRolePermissions(Number(roleId), [...selected]);
      toast.success("Permisos actualizados");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "No se pudieron guardar los permisos",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[#13529a]">
          <ShieldCheck size={22} /> Permisos por rol
        </h1>
        <p className="text-sm text-gray-500">
          Define qué puede hacer cada rol. Los cambios aplican de inmediato.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-[#13529a]" />
          </div>
        ) : (
          <>
            <div className="max-w-xs space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select value={roleId} onValueChange={onSelectRole}>
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Selecciona un rol">
                    {selectedRole?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    {roles
                      .filter((r) => r.name !== "ADMIN")
                      .map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {!roleId && (
              <p className="mt-6 text-sm text-slate-400">
                Selecciona un rol para configurar sus permisos.
              </p>
            )}

            {roleId && loadingRole && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-[#13529a]" />
              </div>
            )}

            {roleId && !loadingRole && isAdminRole && (
              <div className="mt-6 rounded-xl border border-[#13529a]/20 bg-[#13529a]/5 p-4 text-sm text-[#13529a]">
                El rol <strong>ADMIN</strong> es superusuario: tiene todos los
                permisos y no se configura.
              </div>
            )}

            {roleId && !loadingRole && !isAdminRole && (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {grouped.map(([module, mods]) => {
                    const allChecked = mods.every((p) => selected.has(p.id));
                    return (
                      <div
                        key={module}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                            <KeyRound size={14} className="text-[#13529a]" />
                            {module}
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleModule(mods, allChecked)}
                            className="cursor-pointer text-xs font-medium text-[#13529a] hover:underline"
                          >
                            {allChecked ? "Quitar todos" : "Marcar todos"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {mods.map((p) => (
                            <label
                              key={p.id}
                              className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                            >
                              <input
                                type="checkbox"
                                checked={selected.has(p.id)}
                                onChange={() => toggle(p.id)}
                                className="h-4 w-4 rounded border-slate-300 text-[#13529a] focus:ring-[#13529a]"
                              />
                              {p.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end border-t pt-4">
                  <Button
                    onClick={save}
                    disabled={saving}
                    className="cursor-pointer bg-[#13529a] text-white hover:bg-[#0f3f7a]"
                  >
                    {saving ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Save size={16} className="mr-2" />
                    )}
                    Guardar permisos
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
