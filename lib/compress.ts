/**
 * 客户端图片压缩：上传前把大图压缩到合理大小，
 * 规避 Vercel 等平台的请求体大小限制（4.5MB），也节省流量。
 * - svg / gif（动画）不压缩
 * - 小于 500KB 不处理
 * - 其余用 canvas 缩放（最长边 maxDim）并转 WebP/JPEG
 */
export async function compressImage(
  file: File,
  maxDim = 1920,
  quality = 0.85
): Promise<File> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "svg" || ext === "gif") return file;
  if (file.size < 500 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    // 带透明用 webp，否则 jpeg
    const isWebp = ext === "png" || ext === "webp";
    const type = isWebp ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, isWebp ? ".webp" : ".jpg");
    return new File([blob], newName, { type });
  } catch {
    return file; // 压缩失败则原样上传
  }
}

/** 容错解析响应 JSON：非 JSON（如平台 413 文本）也返回可读错误 */
export async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // 提取如 "Request Entity Too Large" 之类的可读信息
    const m = text.match(/[A-Za-z ]{3,40}/);
    throw new Error((m ? m[0].trim() : "上传失败") + "（图片可能过大）");
  }
}
