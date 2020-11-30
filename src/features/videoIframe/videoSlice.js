import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // url: 'https://coachyard.daily.co/VEEbX1t95wtc3h5mIEcE'
  url: ''
};

const { actions, reducer } = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setUrl: (state, action) => {
      state.url = action.payload;
    }
  }
});

const selectors = {
  select: ({ video }) => video
};

export { selectors, actions };
export default reducer;
