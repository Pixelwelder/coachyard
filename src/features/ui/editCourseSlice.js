import { createUISlice } from './createUISlice';

const initialState = {
  isEditing: false,

  displayName: '',
  description: '',
  image: '',
  price: 0,
  type: 'invite'
};

export default createUISlice({ name: 'editCourse', initialState });
