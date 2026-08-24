export interface TocItem {
  level: number; // 1-4
  text: string;
  id: string; // h-0, h-1 ...
}

/**
 * 从 Markdown 正文中提取标题（跳过代码块内的 # 行），
 * 用于生成文章目录（TOC），id 按出现顺序编号。
 */
export function extractHeadings(markdown: string): TocItem[] {
  const lines = markdown.split(/\r?\n/);
  const result: TocItem[] = [];
  let inFence = false;
  let fenceChar = "";

  for (const raw of lines) {
    const line = raw.trim();

    // 代码围栏切换（支持 ``` 与 ~~~）
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[1][0];
      } else if (line.startsWith(fenceChar)) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (m) {
      result.push({
        level: m[1].length,
        text: m[2].replace(/[*_`~]/g, "").trim(),
        id: `h-${result.length}`,
      });
    }
  }
  return result;
}
