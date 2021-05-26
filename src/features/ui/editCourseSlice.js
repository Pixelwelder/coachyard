import createUISlice from './createUISlice';

const initialState = {
  isEditing: false,

  displayName: '',
  description: '',
  image: '',
  price: 0,
  priceFrequency: 'one-time', // one-time, monthly
  isPublic: false,
};

export default createUISlice({ name: 'editCourse', initialState });
