import { createAsyncThunk } from '@reduxjs/toolkit';
import createUISlice from './createUISlice';

const name = 'confirmAction';
const initialState = {
  message: 'Are you sure?',
  confirmLabel: 'Yes',
  cancelLabel: 'No',
  onConfirm: () => {},
};

const slice = createUISlice({ name, initialState });

const getConfirmation = createAsyncThunk(
  `${name}/getConfirmation`,
  async ({ params = initialState } = {}, { dispatch }) => {
    dispatch(slice.actions.open(params));
  },
);

export { getConfirmation };
export default slice;
