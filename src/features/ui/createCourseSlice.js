import { createUISlice } from './createUISlice';
import { getDefaultDateTime } from '../../util/itemUtils';

const initialState = {
  isOpen: false,
  displayName: '',
  student: '',
  description: '',
  date: ''
};

export default createUISlice({
  name: 'createCourse',
  initialState,
  reducers: {
    open: () => ({
      ...initialState,
      isOpen: true,
      date: getDefaultDateTime()
    })
  }
});
