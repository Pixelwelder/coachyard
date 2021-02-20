import { createUISlice } from './createUISlice';

const initialState = {
  isEditing: false,

  displayName: '',
  description: '',
  price: 0,
  type: 'invite'
};

export default createUISlice({ name: 'editCourse', initialState });
