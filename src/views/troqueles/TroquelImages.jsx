import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import troquelesService from "../../services/troqueles.service";
import { ImagePlus, Loader2, Trash2, ImageOff } from "lucide-react";

const MAX_IMAGES = 3;
const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB (debe coincidir con la policy del backend)
const ALLOWED_MIME = ["image/jpeg", "image/png"];

export default function TroquelImages({ troquelId }) {
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const remaining = MAX_IMAGES - images.length;

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await troquelesService.getImages(troquelId);
      setImages(res.data || []);
    } catch {
      toast.error("No se pudieron cargar las imágenes del troquel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (troquelId) fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [troquelId]);

  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;

    // Validación en cliente (el backend vuelve a validar de todas formas).
    if (files.length > remaining) {
      toast.error(
        `Solo puedes subir ${remaining} imagen(es) más (máximo ${MAX_IMAGES}).`,
      );
      return;
    }

    for (const file of files) {
      if (!ALLOWED_MIME.includes(file.type)) {
        toast.error("Solo se permiten imágenes JPG o PNG.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`"${file.name}" supera los 3 MB permitidos.`);
        return;
      }
    }

    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      const res = await troquelesService.uploadImages(troquelId, formData);
      setImages(res.data || []);
      toast.success("Imágenes guardadas");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al subir las imágenes");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    try {
      setDeletingId(imageId);
      await troquelesService.deleteImage(troquelId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Imagen eliminada");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al eliminar la imagen");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {images.length}/{MAX_IMAGES}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || remaining <= 0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#13529a] px-2.5 py-1.5 text-xs font-medium text-[#13529a] transition-colors hover:bg-[#13529a]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImagePlus size={14} />
            )}
            {uploading ? "Subiendo..." : "Agregar imagen"}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={handleSelectFiles}
      />

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 py-8">
          <Loader2 size={22} className="animate-spin text-[#13529a]" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-slate-400">
          <ImageOff size={26} />
          <p className="text-xs">Sin imágenes de referencia</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <img
                src={img.url}
                alt="Imagen del troquel"
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className="absolute right-1.5 top-1.5 inline-flex items-center justify-center rounded-full bg-black/55 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-100"
                title="Eliminar imagen"
              >
                {deletingId === img.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        JPG o PNG · máx 3 MB c/u · hasta {MAX_IMAGES} imágenes.
      </p>
    </div>
  );
}

// Pequeño helper para mantener el título alineado con el resto del form.
function Label() {
  return (
    <h3 className="text-xs font-semibold text-slate-900">
      Imágenes de referencia
    </h3>
  );
}
