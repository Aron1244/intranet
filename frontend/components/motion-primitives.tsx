"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
};

export function Reveal({
  children,
  delay = 0,
  y = 16,
  once = true,
  ...rest
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.25 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = Omit<HTMLMotionProps<"div">, "children" | "initial" | "animate" | "transition"> & {
  children: ReactNode;
  stagger?: number;
  initialDelay?: number;
  y?: number;
  once?: boolean;
};

export function StaggerGroup({
  children,
  stagger = 0.08,
  initialDelay = 0,
  once = true,
  inView = false,
  ...rest
}: StaggerProps & { inView?: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  const animationProps = inView
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once, amount: 0.2 },
      }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
      };

  return (
    <motion.div
      {...animationProps}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: initialDelay,
          },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 18,
  ...rest
}: Omit<HTMLMotionProps<"div">, "children"> & { children: ReactNode; y?: number }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}