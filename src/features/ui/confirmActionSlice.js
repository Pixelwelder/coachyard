import { createAsyncThunk } from '@reduxjs/toolkit';
import createUISlice from './createUISlice';

const name = 'confirmAction';
const initialState = {
  message: 'Are you sure?',
  confirmLabel: 'Yes',
  cancelLabel: 'No',
  onConfirm: () => {},
};

const getConfirmation = createAsyncThunk(
  `${name}/getConfirmation`,
  async ({ params = initialState } = {}, { dispatch, getState }) => {
    dispatch(slice.actions.open(params));
  },
);

const slice = createUISlice({ name, initialState });

export { getConfirmation };
export default slice;
