import { createUISlice } from './createUISlice';
import { getDefaultDateTime } from '../../util/itemUtils';

const initialState = {
  displayName: '',
  students: '',
  description: '',
  date: '',
  type: 'invite'
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
