// Recorta una imagen a un cuadrado (para avatar) usando el área calculada por
// react-easy-crop y devuelve un File WEBP optimizado. Al fijar el lienzo en
// 512x512 y exportar en webp, el resultado queda muy por debajo de 1 MB.
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export const getCroppedAvatar = async (imageSrc, cropPixels, size = 512) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    size,
    size,
  );

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );

  if (!blob) throw new Error("No se pudo generar la imagen");

  return new File([blob], "avatar.webp", { type: "image/webp" });
};
