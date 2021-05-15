import { createUISlice } from './createUISlice';

const initialState = {
  isEditing: false,

  displayName: '',
  description: '',
  image: '',
  price: 0,
  isPublic: false
};

export default createUISlice({ name: 'editCourse', initialState });
