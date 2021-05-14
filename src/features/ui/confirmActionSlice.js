import { createUISlice } from './createUISlice';
import { createAsyncThunk } from '@reduxjs/toolkit';

const name = 'confirmAction';
const initialState = {
  message: 'Are you sure?',
  confirmLabel: 'Yes',
  cancelLabel: 'No',
  onConfirm: () => {}
};

const getConfirmation = createAsyncThunk(
  `${name}/getConfirmation`,
  async ({ params = initialState } = {}, { dispatch, getState }) => {
    dispatch(slice.actions.open(params));

  }
);

const slice = createUISlice({ name, initialState });

export { getConfirmation };
export default slice;
