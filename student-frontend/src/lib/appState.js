export const appState = {
  pendingMutations: 0,
  dirtyForms: new Set(),
  
  incrementMutation: () => {
    appState.pendingMutations++;
  },
  
  decrementMutation: () => {
    appState.pendingMutations = Math.max(0, appState.pendingMutations - 1);
  },
  
  setFormDirty: (formId, isDirty) => {
    if (isDirty) {
      appState.dirtyForms.add(formId);
    } else {
      appState.dirtyForms.delete(formId);
    }
  },
  
  isSafeToUpdate: () => {
    return appState.pendingMutations === 0 && appState.dirtyForms.size === 0;
  }
};

window.__studentAppState = appState;
