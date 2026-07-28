/**
 * Document Studio — React store hook.
 *
 * Thin, self-persisting wrapper around {@link studioService}. Holds the durable
 * StudioState (templates / documents / assets / page settings) and exposes
 * memoised overview statistics plus mutators. Ephemeral editor state (current
 * canvas HTML, zoom, selected employee) intentionally lives in the page.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadState,
  saveState,
  createTemplate as makeTemplate,
  duplicateTemplate as makeDuplicate,
  createDocument as makeDocument,
  createAsset as makeAsset,
} from "./studioService";
import type {
  BrandingAsset,
  DocumentTemplate,
  PageSettings,
  StudioDocument,
  StudioState,
} from "./types";

export interface StudioStats {
  totalTemplates: number;
  generatedDocuments: number;
  draftDocuments: number;
  recentlyCreated: number;
  mostUsedTemplate: DocumentTemplate | null;
}

export function useStudioStore() {
  const [state, setState] = useState<StudioState>(() => loadState());
  const hydrated = useRef(false);

  // Persist on every change (after the initial hydrate).
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    saveState(state);
  }, [state]);

  /* ---------------- templates ---------------- */
  const addTemplate = useCallback(
    (partial: Partial<DocumentTemplate> & { name: string }) => {
      const tpl = makeTemplate(partial);
      setState((s) => ({ ...s, templates: [tpl, ...s.templates] }));
      return tpl;
    },
    []
  );

  const updateTemplate = useCallback(
    (id: string, patch: Partial<DocumentTemplate>) => {
      setState((s) => ({
        ...s,
        templates: s.templates.map((t) =>
          t.id === id
            ? { ...t, ...patch, updatedAt: new Date().toISOString() }
            : t
        ),
      }));
    },
    []
  );

  const duplicateTemplate = useCallback((id: string) => {
    let created: DocumentTemplate | null = null;
    setState((s) => {
      const src = s.templates.find((t) => t.id === id);
      if (!src) return s;
      created = makeDuplicate(src);
      return { ...s, templates: [created, ...s.templates] };
    });
    return created;
  }, []);

  const archiveTemplate = useCallback(
    (id: string, archived: boolean) => {
      updateTemplate(id, { archived });
    },
    [updateTemplate]
  );

  const deleteTemplate = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      templates: s.templates.filter((t) => t.id !== id || t.system),
    }));
  }, []);

  const bumpUsage = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      templates: s.templates.map((t) =>
        t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
      ),
    }));
  }, []);

  /* ---------------- documents ---------------- */
  const addDocument = useCallback(
    (partial: Parameters<typeof makeDocument>[0]) => {
      const doc = makeDocument(partial);
      setState((s) => ({ ...s, documents: [doc, ...s.documents] }));
      return doc;
    },
    []
  );

  const updateDocument = useCallback(
    (id: string, patch: Partial<StudioDocument>) => {
      setState((s) => ({
        ...s,
        documents: s.documents.map((d) =>
          d.id === id
            ? { ...d, ...patch, updatedAt: new Date().toISOString() }
            : d
        ),
      }));
    },
    []
  );

  const deleteDocument = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      documents: s.documents.filter((d) => d.id !== id),
    }));
  }, []);

  /* ---------------- assets ---------------- */
  const addAsset = useCallback(
    (partial: Parameters<typeof makeAsset>[0]) => {
      const asset = makeAsset(partial);
      setState((s) => ({ ...s, assets: [...s.assets, asset] }));
      return asset;
    },
    []
  );

  const updateAsset = useCallback(
    (id: string, patch: Partial<BrandingAsset>) => {
      setState((s) => ({
        ...s,
        assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
    },
    []
  );

  const deleteAsset = useCallback((id: string) => {
    setState((s) => ({ ...s, assets: s.assets.filter((a) => a.id !== id) }));
  }, []);

  /* ---------------- page settings ---------------- */
  const setPage = useCallback((patch: Partial<PageSettings>) => {
    setState((s) => ({ ...s, page: { ...s.page, ...patch } }));
  }, []);

  /* ---------------- derived stats ---------------- */
  const stats: StudioStats = useMemo(() => {
    const active = state.templates.filter((t) => !t.archived);
    const generated = state.documents.filter((d) => d.status !== "draft");
    const drafts = state.documents.filter((d) => d.status === "draft");
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = state.documents.filter(
      (d) => new Date(d.createdAt).getTime() >= weekAgo
    );
    const mostUsed =
      [...active].sort((a, b) => b.usageCount - a.usageCount)[0] ?? null;
    return {
      totalTemplates: active.length,
      generatedDocuments: generated.length,
      draftDocuments: drafts.length,
      recentlyCreated: recent.length,
      mostUsedTemplate: mostUsed,
    };
  }, [state.templates, state.documents]);

  return {
    state,
    stats,
    // templates
    addTemplate,
    updateTemplate,
    duplicateTemplate,
    archiveTemplate,
    deleteTemplate,
    bumpUsage,
    // documents
    addDocument,
    updateDocument,
    deleteDocument,
    // assets
    addAsset,
    updateAsset,
    deleteAsset,
    // page
    setPage,
  };
}

export type StudioStore = ReturnType<typeof useStudioStore>;
