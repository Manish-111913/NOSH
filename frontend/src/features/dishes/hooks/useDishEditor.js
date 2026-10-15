import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext.jsx';
import { useDishDrafts } from './useDishDrafts.js';

const CLOSED_CONFLICT = {
  open: false,
  reason: 'conflict', // 'conflict' = a save got 409, 'stale' = polling found a newer saved version
  serverRecord: null,
  confirmingReload: false,
  isReloading: false,
  reloadError: null,
};

/**
 * Everything around editing one dish: the drawer, local drafts, discard confirmation
 * and the conflict dialog. Saved records come from useDishes; drafts never leave the browser until Save.
 */
export function useDishEditor({ dishes, saveDish, fetchDish, replaceDish }) {
  const { showToast } = useToast();
  const { drafts, updateDraft, clearDraft } = useDishDrafts();

  // `dishId` is kept after closing so the drawer keeps its content while sliding out.
  // `session` changes on every open so the drawer's temporary error banners reset.
  const [drawer, setDrawer] = useState({ open: false, dishId: null, session: 0 });
  const [discardOpen, setDiscardOpen] = useState(false);
  const [conflict, setConflict] = useState(CLOSED_CONFLICT);

  const dish = dishes.find((d) => d.dishId === drawer.dishId) ?? null;
  const draft = dish ? drafts[dish.dishId] ?? null : null;
  const form = draft
    ? { dishName: draft.dishName, isPublished: draft.isPublished }
    : dish && { dishName: dish.dishName, isPublished: dish.isPublished };
  // The version this editing session started from. Sent as expectedVersion; never bumped on the client.
  const expectedVersion = draft?.baseVersion ?? dish?.version;
  const hasNewerSavedVersion = Boolean(draft && dish && draft.baseVersion < dish.version);

  // Escape closes the top-most layer: discard dialog, then conflict dialog, then the drawer (the draft is kept).
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return;
      if (discardOpen) setDiscardOpen(false);
      else if (conflict.open && !conflict.isReloading) setConflict((c) => ({ ...c, open: false, confirmingReload: false, reloadError: null }));
      else if (drawer.open && !conflict.open) setDrawer((d) => ({ ...d, open: false }));
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [discardOpen, conflict.open, conflict.isReloading, drawer.open]);

  // ---- Drawer ----
  function openDrawer(dishId) {
    setDrawer((d) => ({ open: true, dishId, session: d.session + 1 }));
  }

  // Closing keeps the draft; it stays marked as "Unsaved local draft" in the table.
  function closeDrawer() {
    setDrawer((d) => ({ ...d, open: false }));
  }

  function changeForm(values) {
    updateDraft(dish, values);
  }

  // Throws ApiError so the drawer can show the matching error state. The draft is kept on any failure.
  async function save(values) {
    const saved = await saveDish(dish.dishId, { ...values, expectedVersion });
    clearDraft(saved.dishId);
    closeDrawer();
    showToast(`Dish updated successfully (v${saved.version}): "${saved.dishName}"`, 'success');
  }

  // ---- Discard ----
  function requestDiscard() {
    if (draft) setDiscardOpen(true);
  }

  function confirmDiscard() {
    if (dish) clearDraft(dish.dishId);
    setDiscardOpen(false);
    closeDrawer();
  }

  // ---- Conflict dialog ----
  function handleConflict(currentDish) {
    replaceDish(currentDish); // show the latest saved record; the draft stays untouched
    setConflict({ ...CLOSED_CONFLICT, open: true, reason: 'conflict', serverRecord: currentDish });
  }

  function reviewNewerVersion() {
    setConflict({ ...CLOSED_CONFLICT, open: true, reason: 'stale', serverRecord: dish });
  }

  function closeConflict() {
    setConflict((c) => ({ ...c, open: false, confirmingReload: false, reloadError: null }));
  }

  function keepDraft() {
    closeConflict();
    showToast(`Your draft is kept. It is still based on v${expectedVersion}, so saving it will conflict until you reload.`, 'info');
  }

  // Replaces the draft with the latest saved record — only after the server confirms what that record is.
  async function confirmReload() {
    setConflict((c) => ({ ...c, isReloading: true, reloadError: null }));
    try {
      const latest = await fetchDish(dish.dishId);
      clearDraft(latest.dishId);
      setConflict((c) => ({ ...c, open: false, confirmingReload: false, isReloading: false }));
      openDrawer(latest.dishId);
      showToast(`Loaded the latest saved version (v${latest.version}). Your draft was discarded.`, 'success');
    } catch (err) {
      setConflict((c) => ({
        ...c,
        isReloading: false,
        reloadError:
          err.status === 404
            ? 'This dish no longer exists on the server.'
            : `Could not load the latest version (${err.message}). Your draft is unchanged — try again.`,
      }));
    }
  }

  return {
    drafts,
    editingDishId: drawer.open ? drawer.dishId : null,
    drawer: { open: drawer.open, session: drawer.session, dish, form, hasDraft: Boolean(draft), expectedVersion, hasNewerSavedVersion },
    discardOpen,
    conflict,

    openDrawer,
    closeDrawer,
    changeForm,
    save,

    requestDiscard,
    confirmDiscard,
    keepEditing: () => setDiscardOpen(false),

    handleConflict,
    reviewNewerVersion,
    closeConflict,
    keepDraft,
    promptReload: () => setConflict((c) => ({ ...c, confirmingReload: true })),
    cancelReload: () => setConflict((c) => ({ ...c, confirmingReload: false, reloadError: null })),
    confirmReload,
  };
}
