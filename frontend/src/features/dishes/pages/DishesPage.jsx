import AppShell from '@/components/layout/AppShell.jsx';
import { useToast } from '@/context/ToastContext.jsx';
import { MODE } from '../constants.js';
import { useDishes } from '../hooks/useDishes.js';
import { useDishEditor } from '../hooks/useDishEditor.js';
import { getDishesMode } from '../utils/dishMode.js';
import PageHeading from '../components/PageHeading.jsx';
import BackendFailureBanner from '../components/BackendFailureBanner.jsx';
import MetricsRow from '../components/MetricsRow.jsx';
import DishTable from '../components/table/DishTable.jsx';
import EditDrawer from '../components/edit-drawer/EditDrawer.jsx';
import ConflictModal from '../components/modals/ConflictModal.jsx';
import DiscardModal from '../components/modals/DiscardModal.jsx';

export default function DishesPage() {
  const { showToast } = useToast();
  const { dishes, status, loadError, isRefreshing, connection, refresh, saveDish, fetchDish, replaceDish } = useDishes();
  const editor = useDishEditor({ dishes, saveDish, fetchDish, replaceDish });

  const mode = getDishesMode(status, dishes);
  const showStaleDataBanner = status === 'success' && loadError;

  async function handleRefresh() {
    showToast('Refreshing dish records from server...', 'info');
    const { ok, error } = await refresh();
    if (ok) showToast('Dish records updated.', 'info');
    else showToast(`Unable to refresh dishes. ${error.message}`, 'error');
  }

  async function handleRetry() {
    const { ok } = await refresh();
    if (ok) showToast('Server connection restored.', 'success');
  }

  return (
    <>
      <AppShell connection={connection} isRefreshing={isRefreshing} onRefresh={handleRefresh}>
        <PageHeading isRefreshing={isRefreshing} onRefresh={handleRefresh} />

        {mode === MODE.ERROR && <BackendFailureBanner variant="failed" error={loadError} onRetry={handleRetry} />}
        {showStaleDataBanner && <BackendFailureBanner variant="stale" error={loadError} onRetry={handleRetry} />}

        <MetricsRow mode={mode} dishes={dishes} />
        <DishTable
          dishes={dishes}
          drafts={editor.drafts}
          mode={mode}
          connection={connection}
          editingDishId={editor.editingDishId}
          onEdit={editor.openDrawer}
          onRefresh={handleRefresh}
        />
      </AppShell>

      <EditDrawer
        {...editor.drawer}
        onFormChange={editor.changeForm}
        onClose={editor.closeDrawer}
        onDiscard={editor.requestDiscard}
        onSave={editor.save}
        onConflict={editor.handleConflict}
        onReviewNewerVersion={editor.reviewNewerVersion}
      />

      <ConflictModal
        {...editor.conflict}
        draft={editor.drawer.form}
        expectedVersion={editor.drawer.expectedVersion}
        onClose={editor.closeConflict}
        onKeepDraft={editor.keepDraft}
        onPromptReload={editor.promptReload}
        onCancelReload={editor.cancelReload}
        onConfirmReload={editor.confirmReload}
      />

      <DiscardModal open={editor.discardOpen} onKeepEditing={editor.keepEditing} onConfirm={editor.confirmDiscard} />
    </>
  );
}
