"use client";

import { ElementType, ReactNode, CSSProperties } from "react";
import { useInView } from "@/hooks/useInView";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
};

/** Fades/slides content in when it enters the viewport. Content is never hidden without JS or with reduced motion. */
export default function Reveal({ as: Tag = "div", children, className = "", delay = 0, id }: Props) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  return (
    <Tag
      ref={ref}
      id={id}
      className={`reveal ${inView ? "is-visible" : ""} ${className}`.trim()}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
