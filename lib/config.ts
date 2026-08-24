import type { SiteConfig } from "./types";

/** 默认背景配置：渐变跟随主题，无图片，模糊 0，不压暗 */
export const DEFAULT_CONFIG: SiteConfig = {
  backgroundType: "gradient",
  gradient: "",
  image: "",
  blur: 0,
  overlay: 0,
};

/** 后台可选渐变预设 */
export const bgGradients = [
  "linear-gradient(135deg, #ffe8f3 0%, #e8e4ff 40%, #d6ecff 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #a18cd1 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  "linear-gradient(135deg, #42275a 0%, #734b6d 100%)",
  "linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)",
  "linear-gradient(135deg, #ff512f 0%, #f09819 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
];

/**
 * 把配置应用到页面（客户端）：写入 <html> 的内联 CSS 变量，
 * 背景层 .bg 的伪元素读取这些变量渲染图片 / 模糊 / 压暗。
 */
export function applyConfig(cfg: SiteConfig): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  const hasImage = cfg.backgroundType === "image" && !!cfg.image;
  el.style.setProperty("--bg-image", hasImage ? `url("${cfg.image}")` : "none");
  el.style.setProperty("--bg-blur", `${cfg.blur}px`);
  el.style.setProperty("--bg-overlay", String(cfg.overlay));
  el.style.setProperty("--bg-image-opacity", hasImage ? "1" : "0");
  // 渐变：用户选择了预设/自定义渐变才覆盖主题默认
  if (cfg.gradient && cfg.backgroundType === "gradient") {
    el.style.setProperty("--bg-grad", cfg.gradient);
  } else if (!cfg.gradient) {
    el.style.removeProperty("--bg-grad");
  }
}
