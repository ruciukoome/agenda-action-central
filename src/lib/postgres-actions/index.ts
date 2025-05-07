
/**
 * POSTGRESQL ACTIONS API
 * ---------------------
 * Re-exports all PostgreSQL-based action-related functions
 */

import { fetchActions as pgFetchActions } from './fetchActions';
import { createAction as pgCreateAction } from './createAction';
import { updateAction as pgUpdateAction } from './updateAction';
import { deleteAction as pgDeleteAction } from './deleteAction';
import { mockFetchActions, mockCreateAction, mockUpdateAction, mockDeleteAction } from './browser-mock';

// Check if we're running in browser
const isBrowser = typeof window !== 'undefined';

// Export the appropriate implementation for the environment
export const fetchActions = isBrowser ? mockFetchActions : pgFetchActions;
export const createAction = isBrowser ? mockCreateAction : pgCreateAction;
export const updateAction = isBrowser ? mockUpdateAction : pgUpdateAction;
export const deleteAction = isBrowser ? mockDeleteAction : pgDeleteAction;
