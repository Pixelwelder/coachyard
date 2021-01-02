import { createUISlice } from './createUISlice';

const initialState = {
  isChangingFile: false,
  bytesTransferred: 0,
  totalBytes: 0,

  courseUid: '',
  displayName: '',
  description: '',
  date: '',
  file: ''
};

export default createUISlice({ name: 'editItem', initialState });
