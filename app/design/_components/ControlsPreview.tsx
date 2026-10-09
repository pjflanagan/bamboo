"use client";

import { useState } from "react";
import { Button, SegmentedControl } from "@/design-system/controls";
import { Cluster, Stack } from "@/design-system/layout";
import { Modal } from "@/design-system/overlays";

type Size = "sm" | "md" | "lg";
const SIZES = (["sm", "md", "lg"] as const).map((value) => ({ value, label: value }));

const SETS = ["Adjectives", "Basics", "Dining", "Directions", "Dishes", "Foods", "Kitchen"];

/** Buttons and modals in the current theme. */
export function ControlsPreview() {
  const [size, setSize] = useState<Size>("md");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  return (
    <Stack gap={6}>
      <Cluster gap={2} align="center">
        <Button variant="primary">Primary</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button size="sm">Small</Button>
      </Cluster>

      <Cluster gap={3} align="flex-end">
        <SegmentedControl
          label="Modal size"
          size="sm"
          options={SIZES}
          value={size}
          onChange={setSize}
        />
        <Button onClick={() => setConfirmOpen(true)}>Open confirm</Button>
        <Button onClick={() => setListOpen(true)}>Open long list</Button>
      </Cluster>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size={size}
        title="Reset this set?"
        description="Every card in Basics 1 goes back to unknown. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setConfirmOpen(false)}>
              Reset
            </Button>
          </>
        }
      />

      <Modal
        open={listOpen}
        onClose={() => setListOpen(false)}
        size={size}
        title="Choose a flashcard set"
        footer={<Button onClick={() => setListOpen(false)}>Done</Button>}
      >
        <Stack gap={4}>
          {SETS.flatMap((topic) =>
            [1, 2, 3].map((n) => (
              <p key={`${topic}-${n}`} style={{ margin: 0 }}>
                {topic} {n}: the body scrolls while the title and footer stay put.
              </p>
            )),
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}
