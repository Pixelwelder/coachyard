import { createUISlice } from './createUISlice';

const initialState = {
  isEditing: false,

  courseUid: '',
  displayName: '',
  description: '',
  date: '',
  isChangingFile: false,
  file: '',
  bytesTransferred: 0,
  totalBytes: 0
};

export default createUISlice({ name: 'editItem', initialState });
