import { createUISlice } from './createUISlice';
import { isPendingAction, isThisAction } from '../../util/reduxUtils';

const initialState = {
  isChangingFile: false,
  bytesTransferred: 0,
  totalBytes: 0,

  courseUid: '',
  displayName: '',
  description: '',
  scheduler: 'student', // 'teacher' or 'student'
  date: '',
  file: ''
};

const isUploadProgress = action => action.type === 'upload/progress';
const isUploadError = action => action.type === 'upload/error';
const isUploadComplete = action => action.type === 'upload/complete';

export default createUISlice({
  name: 'updateItem',
  initialState,
  builderFunc: (builder) => {
    builder
      .addMatcher(isUploadProgress, (state, action) => {
        // state.isLoading = true;
        state.bytesTransferred = action.payload.bytesTransferred;
        state.totalBytes = action.payload.totalBytes;
      })
      .addMatcher(
        action => action.type == '_uploadItem/pending',
        (state, action) => {

      })
      // .addMatcher(isUploadError, (state, action) => {
      //   // state.isLoading = false;
      // })
      // .addMatcher(isUploadComplete, (state, action) => {
      //   // state.isLoading = false;
      // });
  }
});
