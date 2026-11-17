export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, WebP, etc.).');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode the selected image file.'));
      el.src = objectUrl;
    });

    const renderScaled = (maxDim: number, quality: number): string => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Browser canvas is unavailable for image compression.');
      }
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', quality);
    };

    let dataUrl = renderScaled(720, 0.72);
    if (dataUrl.length > 240000) {
      dataUrl = renderScaled(540, 0.55);
    }
    if (dataUrl.length > 240000) {
      throw new Error('Image is still too large after compression. Please pick a smaller image or paste an image URL.');
    }

    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
