import type { ElementType, ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  eyebrow: string;
  icon?: ReactNode;
  title: string;
  titleAs?: "h1" | "h2";
  children: ReactNode;
};

export function EmptyState({
  action,
  children,
  eyebrow,
  icon = "○",
  title,
  titleAs = "h2",
}: EmptyStateProps) {
  const Heading: ElementType = titleAs;

  return (
    <section className="empty-state">
      <span aria-hidden="true" className="empty-state__icon">
        {icon}
      </span>
      <p className="eyebrow">{eyebrow}</p>
      <Heading>{title}</Heading>
      <div className="empty-state__copy">{children}</div>
      {action && <div className="empty-state__action">{action}</div>}
    </section>
  );
}
