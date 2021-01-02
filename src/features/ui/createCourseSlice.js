import { createUISlice } from './createUISlice';
import { DateTime } from 'luxon';

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
    open: (state, action) => {
      // Default to a date/time that's a nice round number in the future.
      // At least an hour away, at the top of the hour.
      const hours = DateTime.local().hour + 2;
      const date = DateTime.local().set({ hours, minutes: 0, seconds: 0, milliseconds: 0 }).toUTC().toString();
      return {
        ...initialState,
        isOpen: true,
        date
      };
    }
  }
});
