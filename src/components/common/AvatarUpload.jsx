import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Loader2, Camera, Trash2 } from "lucide-react";
import { getCroppedAvatar } from "@/lib/cropImage";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Reutilizable: muestra el avatar (o el icono como fallback) y permite elegir
// una imagen, recortarla (circular) y devolver un File webp listo para subir.
// No sube por sí mismo: entrega el File al padre vía onChange(file, previewUrl).
export default function AvatarUpload({
  previewUrl,
  onChange,
  onRemove,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onSelectFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast.error("Solo se permiten imágenes JPG, PNG o WEBP");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const confirmCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      setProcessing(true);
      const file = await getCroppedAvatar(imageSrc, croppedAreaPixels);
      const preview = URL.createObjectURL(file);
      onChange?.(file, preview);
      setModalOpen(false);
      setImageSrc(null);
    } catch {
      toast.error("No se pudo procesar la imagen");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="h-24 w-24 border border-slate-200">
        {previewUrl ? <AvatarImage src={previewUrl} alt="avatar" /> : null}
        <AvatarFallback className="bg-[#13529a]/10 text-[#13529a]">
          <User size={34} />
        </AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onSelectFile}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer"
        >
          <Camera size={14} className="mr-2" />
          Cambiar foto
        </Button>

        {onRemove && previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onRemove}
            className="cursor-pointer text-red-600 hover:text-red-700"
          >
            <Trash2 size={14} className="mr-2" />
            Quitar
          </Button>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !processing && setModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
            <h3 className="mb-3 text-sm font-semibold text-[#13529a]">
              Recortar foto de perfil
            </h3>

            <div className="relative h-64 w-full overflow-hidden rounded-lg bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1 cursor-pointer text-sm"
                disabled={processing}
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-9 flex-1 cursor-pointer bg-[#13529a] text-sm text-white hover:bg-[#0f3f7a]"
                disabled={processing}
                onClick={confirmCrop}
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Aplicar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
