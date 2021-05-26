import createUISlice from './createUISlice';

const initialState = {
  isEditing: false,

  displayName: '',
  description: '',
  image: '',
  price: 0,
  priceFrequency: 'one-time', // one-time, month
  isPublic: false,
};

export default createUISlice({ name: 'editCourse', initialState });
