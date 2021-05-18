import createUISlice from './createUISlice';

const initialState = {
  isEditing: false,

  description: '',
  slug: '',
};

export default createUISlice({ name: 'editCoach', initialState });
