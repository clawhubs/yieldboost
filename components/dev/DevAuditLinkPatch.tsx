"use client";

import { useEffect } from "react";

const LINK_REWRITES = [
  ["/judge/project", "/dev/brief"],
  ["/judge/roadmap", "/dev/roadmap"],
  ["/pitchdeck/yieldboost-pitchdeck.html", "/dev/pitchdeck"],
] as const;

export default function DevAuditLinkPatch() {
  useEffect(() => {
    const rewriteLinks = () => {
      for (const [fromHref, toHref] of LINK_REWRITES) {
        const anchors = document.querySelectorAll<HTMLAnchorElement>(`a[href="${fromHref}"]`);
        for (const anchor of anchors) {
          anchor.setAttribute("href", toHref);
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noreferrer");
        }
      }
    };

    rewriteLinks();
    const observer = new MutationObserver(rewriteLinks);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
