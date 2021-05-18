import createUISlice from './createUISlice';
import { getDefaultDateTime } from '../../util/itemUtils';

const initialState = {
  courseUid: '',
  displayName: '',
  description: '',
  date: '',
  file: '',
  type: '',

  isChangingFile: false,
  bytesTransferred: 0,
  totalBytes: 0,
};

export default createUISlice({
  name: 'createItem',
  initialState,
  reducers: {
    open: () => ({
      ...initialState,
      isOpen: true,
      date: getDefaultDateTime(),
    }),
  },
});
