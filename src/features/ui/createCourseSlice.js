import { createSlice } from '@reduxjs/toolkit';
import { createUISlice } from './createUISlice';
import MODES from './Modes';

const initialState = {
  mode: MODES.CLOSED,
  displayName: '',
  student: '',
  description: '',
  date: ''
};

export default createUISlice({ name: 'newCourse', initialState });
