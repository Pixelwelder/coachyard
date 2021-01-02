import { createUISlice } from './createUISlice';
import { DateTime } from 'luxon';
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
