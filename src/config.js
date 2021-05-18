import _easy from './__config__/easy.json';
import _firebase from './__config__/firebase.json';

const target = 'local';

export const easy = _easy[target];
export const firebase = _firebase[target];
