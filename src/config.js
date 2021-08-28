import _easy from './__config__/easy.json';
import _firebase from './__config__/firebase.json';
import _stripe from './__config__/stripe.json';

const target = 'local'; // local | dev | prod

export const easy = _easy[target];
export const firebase = _firebase[target];
export const stripe = _stripe[target];
