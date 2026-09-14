import { useState, useEffect } from "react";
import { toast } from "sonner";
import troquelesService from "../../services/troqueles.service";
import { X, Loader2, Download, ImageOff } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Modal reutilizable para VER y DESCARGAR las imágenes de un troquel desde R2.
// Se usa en la lista de troqueles, en el detalle de producto y en el de tercero.
export default function TroquelImagesViewer({
  troquelId,
  open,
  onClose,
  title = "Imágenes del troquel",
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (open && troquelId) fetchImages();
    if (!open) setImages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, troquelId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await troquelesService.getImages(troquelId);
      setImages(res.data || []);
    } catch {
      toast.error("No se pudieron cargar las imágenes");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (img) => {
    try {
      setDownloadingId(img.id);
      // La URL firmada de R2 es de otro origen; se descarga como blob para
      // forzar la descarga en vez de abrirla en otra pestaña.
      const res = await fetch(img.url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const ext = img.mime === "image/png" ? "png" : "jpg";
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `troquel-${troquelId}-${img.id}.${ext}`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("No se pudo descargar la imagen");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative mx-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1.5 w-full bg-[#13529a]" />
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-bold text-[#13529a]">{title}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={26} className="animate-spin text-[#13529a]" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <ImageOff size={28} />
              <p className="text-sm">Este troquel no tiene imágenes.</p>
            </div>
          ) : (
            <Carousel className="mx-auto w-full max-w-md px-8">
              <CarouselContent>
                {images.map((img) => (
                  <CarouselItem key={img.id}>
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <img
                        src={img.url}
                        alt="Imagen del troquel"
                        loading="lazy"
                        className="mx-auto max-h-[60vh] w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => handleDownload(img)}
                        disabled={downloadingId === img.id}
                        className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-[#13529a] disabled:opacity-70"
                        title="Descargar"
                      >
                        {downloadingId === img.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                        Descargar
                      </button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </>
              )}
            </Carousel>
          )}
        </div>
      </div>
    </div>
  );
}
