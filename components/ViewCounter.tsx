"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  postId: string;
  /** SSR 时服务端已有的阅读量 */
  initialViews: number;
}

/** 文章阅读量：挂载后调用接口 +1（页面刷新不重复计数），并实时更新显示 */
export default function ViewCounter({ postId, initialViews }: Props) {
  const [views, setViews] = useState(initialViews);
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    fetch(`/api/posts/${postId}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.views === "number") setViews(d.views);
      })
      .catch(() => {
        /* 计数失败不影响阅读 */
      });
  }, [postId]);

  return <span className="post-views">👁 {views}</span>;
}
