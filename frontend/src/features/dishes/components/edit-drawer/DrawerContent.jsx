import { useState } from 'react';
import { getPublishProblems } from '../../utils/dishValidation.js';
import DrawerHeader from './DrawerHeader.jsx';
import NewerVersionBanner from './NewerVersionBanner.jsx';
import DishNotFoundState from './DishNotFoundState.jsx';
import DishIdentityCard from './DishIdentityCard.jsx';
import DishEditForm from './DishEditForm.jsx';
import OccInfoPanel from './OccInfoPanel.jsx';
import SaveErrorBanner from './SaveErrorBanner.jsx';
import DrawerFooter from './DrawerFooter.jsx';

export default function DrawerContent({
  dish,
  form,
  hasDraft,
  expectedVersion,
  hasNewerSavedVersion,
  onFormChange,
  onClose,
  onDiscard,
  onSave,
  onConflict,
  onReviewNewerVersion,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null); // { kind: 'validation' | 'network', message }
  const [isNotFound, setIsNotFound] = useState(false);
  const [newerBannerDismissed, setNewerBannerDismissed] = useState(false);

  const problems = getPublishProblems(form, dish);
  const canSave = hasDraft && !problems.nameMissing && !problems.invalidImageUrl && !isSaving;

  async function handleSave() {
    if (!canSave) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({ dishName: form.dishName.trim(), isPublished: form.isPublished });
    } catch (err) {
      // Every failure keeps the draft exactly as it is.
      if (err.code === 'VERSION_CONFLICT' && err.data?.currentDish) onConflict(err.data.currentDish);
      else if (err.status === 404) setIsNotFound(true);
      else if (err.status === 400) setSaveError({ kind: 'validation', message: err.message });
      else setSaveError({ kind: 'network', message: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <DrawerHeader dish={dish} hasDraft={hasDraft} onClose={onClose} />

      {hasNewerSavedVersion && !newerBannerDismissed && !isNotFound && (
        <NewerVersionBanner
          savedVersion={dish.version}
          draftVersion={expectedVersion}
          onReview={onReviewNewerVersion}
          onDismiss={() => setNewerBannerDismissed(true)}
        />
      )}

      {isNotFound ? (
        <DishNotFoundState onBack={onClose} />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 text-xs">
          <DishIdentityCard dish={dish} />
          <DishEditForm
            dish={dish}
            form={form}
            disabled={isSaving}
            showNameError={problems.nameMissing}
            showImageError={problems.invalidImageUrl}
            onChange={onFormChange}
          />
          <OccInfoPanel expectedVersion={expectedVersion} savedVersion={dish.version} />
        </div>
      )}

      {saveError && <SaveErrorBanner error={saveError} isRetrying={isSaving} onRetry={handleSave} onDismiss={() => setSaveError(null)} />}

      {!isNotFound && (
        <DrawerFooter hasDraft={hasDraft} canSave={canSave} isSaving={isSaving} onSave={handleSave} onDiscard={onDiscard} onClose={onClose} />
      )}
    </>
  );
}
