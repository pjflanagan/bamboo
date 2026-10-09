"use client";

import { useEffect, useState } from "react";
import { expandDictionary, type CompactDictionary, type Dictionary } from "@/lib/hanzi";

/** Fetched once per page load, shared by every caller. */
let loading: Promise<Dictionary> | undefined;

function loadDictionary(): Promise<Dictionary> {
  loading ??= fetch("/api/dictionary")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<CompactDictionary>;
    })
    .then(expandDictionary)
    .catch((error: unknown) => {
      loading = undefined; // let a later mount retry
      throw error;
    });
  return loading;
}

export type DictionaryState =
  { status: "loading" } | { status: "error" } | { status: "ready"; dictionary: Dictionary };

/**
 * The whole dictionary, from /api/dictionary (static JSON), for tokenizing
 * text typed in the browser.
 */
export function useDictionary(): DictionaryState {
  const [state, setState] = useState<DictionaryState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadDictionary().then(
      (dictionary) => !cancelled && setState({ status: "ready", dictionary }),
      () => !cancelled && setState({ status: "error" }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
