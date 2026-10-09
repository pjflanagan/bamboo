"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/design-system/icons";
import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  /**
   * Called whenever the modal closes: the close button, Escape, a click on
   * the backdrop, or a <form method="dialog"> inside it. Set `open` to false.
   */
  onClose: () => void;
  /** Required: it's the dialog's accessible name. */
  title: ReactNode;
  description?: ReactNode;
  /** Fixed between the title and the scrolling body: tabs, a search field. */
  toolbar?: ReactNode;
  /** Actions pinned under the scrolling body, aligned to the end. */
  footer?: ReactNode;
  /** Max width: sm 400px, md 560px, lg 760px. */
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
};

/**
 * A modal dialog on the native <dialog> element, opened with showModal().
 * The browser provides the top layer, focus trapping, an inert page behind
 * it, Escape to close, and returning focus to the opener.
 *
 * Centered panel on wide screens, a bottom sheet on phones. The header and
 * footer stay put while the body scrolls; the page behind doesn't scroll.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  toolbar,
  footer,
  size = "md",
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  // Whether the current click started on the backdrop. Without this, a text
  // selection dragged from inside the panel out onto the backdrop would close it.
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      data-size={size}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      // The panel fills the dialog, so the dialog itself is only the target
      // when the press lands on the ::backdrop.
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget) {
          event.currentTarget.close();
        }
        pressedBackdrop.current = false;
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={() => ref.current?.close()}
          >
            <CloseIcon size={18} />
          </button>
        </header>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
        {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
        {children && <div className={styles.body}>{children}</div>}
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
}
