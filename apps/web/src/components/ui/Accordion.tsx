import type { ReactNode } from "react";
import { PlusIcon } from "./Icons";

export interface AccordionItem {
  id: string;
  question: string;
  answer: ReactNode;
  defaultOpen?: boolean;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  className?: string;
}

export function Accordion({ items, className = "" }: AccordionProps) {
  return (
    <div className={`tk-accordion ${className}`.trim()}>
      {items.map((item) => (
        <details key={item.id} className="tk-accordion__item" open={item.defaultOpen}>
          <summary className="tk-accordion__summary">
            <span>{item.question}</span>
            <span className="tk-accordion__icon" aria-hidden="true">
              <PlusIcon size={20} />
            </span>
          </summary>
          <div className="tk-accordion__content">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
