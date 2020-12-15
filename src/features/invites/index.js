import React, { useEffect, useState } from 'react';

import { selectors as invitesSelectors, actions as invitesActions } from './invitesSlice';
import { actions as appActions, selectors as appSelectors } from '../app/appSlice';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import CachedIcon from '@material-ui/icons/Cached';
import AddIcon from '@material-ui/icons/Add';
import { DataGrid } from '@material-ui/data-grid';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';

// const Invites = ({ items, error, onNew, onRefresh }) => {
//   const [showNewDialog, setShowNewDialog] = useState(false);
//   const [displayName, setDisplayName] = useState('');
//   const [email, setEmail] = useState('');
//
//   const columns = [
//     { field: 'displayName', headerName: 'Name', width: 220 },
//     { field: 'email', headerName: 'Email', width: 220 },
//     // { field: 'uid', headerName: 'Is Member?', width: 220, valueFormatter: ({ value }) => !!value },
//   ];
//
//   const onSubmit = () => {
//
//   };
//
//   return (
//     <div>
//       <div>
//         <Button onClick={onRefresh}>
//           <CachedIcon />
//         </Button>
//         <Button onClick={() => setShowNewDialog(true)}>
//           <AddIcon />
//         </Button>
//       </div>
//       <div style={{ height: 200 }}>
//         <DataGrid
//           rows={items}
//           columns={columns}
//         />
//       </div>
//
//       <Dialog open={showNewDialog} onClose={() => setShowNewDialog(false)} aria-labelledby="form-dialog-title">
//         <DialogTitle id="form-dialog-title">Invite New Student</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Who would you like to invite?
//           </DialogContentText>
//           <form>
//             <TextField
//               fullWidth autoFocus
//               variant="filled" label="Student Name" placeholder="Student Name"
//               id="displayName" value={displayName}
//               onChange={({ target: { value } }) => setDisplayName(value)}
//             />
//             <TextField
//               fullWidth
//               variant="filled" label="Student Email" placeholder="Student Email"
//               id="email" value={email}
//               onChange={({ target: { value } }) => setEmail(value)}
//             />
//           </form>
//           {!!error && <Alert severity="error">{error.message}</Alert>}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setShowNewDialog(false)} color="primary">
//             Cancel
//           </Button>
//           <Button
//             onClick={onsubmit}
//             color="primary"
//             disabled={!displayName || !email}
//           >
//             Add
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

const InvitesFrom = () => {
  const { authUser } = useSelector(appSelectors.select);
  const { invitesFrom } = useSelector(invitesSelectors.select);
  const dispatch = useDispatch();

  useEffect(() => {
    const go = async () => {
      dispatch(invitesActions.getInvitesFrom());
    };
    if (authUser) go();
  }, [authUser, dispatch]);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const columns = [
    { field: 'displayName', headerName: 'Name', width: 220 },
    { field: 'email', headerName: 'Email', width: 220 },
    // { field: 'uid', headerName: 'Is Member?', width: 220, valueFormatter: ({ value }) => !!value },
  ];

  const onSubmit = async () => {
    dispatch(invitesActions.createInvite({ email, displayName }));
  };

  const onRefresh = () => {};

  return (
    <div>
      <div>
        <Button onClick={onRefresh}>
          <CachedIcon />
        </Button>
        <Button onClick={() => setShowNewDialog(true)}>
          <AddIcon />
        </Button>
      </div>
      <div style={{ height: 200 }}>
        <DataGrid
          rows={invitesFrom}
          columns={columns}
        />
      </div>

      <Dialog open={showNewDialog} onClose={() => setShowNewDialog(false)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Invite New Student</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Who would you like to invite?
          </DialogContentText>
          <form>
            <TextField
              fullWidth autoFocus
              variant="filled" label="Student Name" placeholder="Student Name"
              id="displayName" value={displayName}
              onChange={({ target: { value } }) => setDisplayName(value)}
            />
            <TextField
              fullWidth
              variant="filled" label="Student Email" placeholder="Student Email"
              id="email" value={email}
              onChange={({ target: { value } }) => setEmail(value)}
            />
          </form>
          {/*{!!error && <Alert severity="error">{error.message}</Alert>}*/}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            color="primary"
            disabled={!displayName || !email}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const InvitesTo = () => {
  const { authUser } = useSelector(appSelectors.select);
  const { invitesTo } = useSelector(invitesSelectors.select);
  const dispatch = useDispatch();

  useEffect(() => {
    const go = async () => {
      dispatch(invitesActions.getInvitesTo());
    };
    if (authUser) go();
  }, [authUser, dispatch]);

  return <p>Invites to me: {invitesTo?.length || '0'}</p>
};

export { InvitesFrom, InvitesTo };
