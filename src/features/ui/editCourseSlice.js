import { createUISlice } from './createUISlice';

const initialState = {
  isEditing: false,

  displayName: '',
  student: '',
  description: ''
};

export default createUISlice({ name: 'editCourse', initialState });
