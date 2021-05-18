import { createSlice } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

import MODES from './Modes';

const baseDialog = {
  mode: MODES.CLOSED,
  isLoading: false,
  error: null,
};

// Used by multiple UI elements.
const baseItemElement = {
  courseUid: '',
  displayName: '',
  description: '',
  date: '',
  isChangingFile: false,
  file: '',
  bytesTransferred: 0,
  totalBytes: 0,
};

const initialState = {
  // TODO
  showAccount: false,

  newCourseDialog: {
    ...baseDialog,
    displayName: '',
    email: '',
    date: '',
  },

  newItemDialog: {
    ...baseDialog,
    ...baseItemElement,
  },

  deleteDialog: {
    ...baseDialog,
    uid: '',
  },

  editItem: {
    ...baseItemElement,
  },
};

const { actions, reducer } = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openDialog: (state, action) => {
      const { name, params = {} } = action.payload;
      const subState = state[name];
      state[name] = {
        ...subState,
        mode: MODES.VIEW,
        ...params,
      };

      // Special cases.
      if (subState.hasOwnProperty('date')) {
        // Choose a nice date in the near future.
        const hours = DateTime.local().hour + 2;
        state[name].date = DateTime.local().set({
          hours, minutes: 0, seconds: 0, milliseconds: 0,
        }).toUTC().toString();
      }
    },
    resetDialog: (state, action) => {
      state[action.payload] = initialState[action.payload];
    },
    setShowAccount: (state, action) => { state.showAccount = action.payload; },
    /**
     * payload - an object that is merged with the root state.
     */
    setUI: (state, action) => {
      Object.entries(action.payload).forEach(([name, value]) => {
        state[name] = value;
      });
    },
    resetUI: (state, action) => {
      state[action.payload] = initialState[action.payload];
    },
  },
});

const select = ({ ui }) => ui;
const selectors = { select };

export { selectors, actions };
export default reducer;
