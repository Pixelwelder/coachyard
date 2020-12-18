import React, { useEffect, useState } from 'react';
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
import Alert from '@material-ui/lab/Alert';
import AcceptIcon from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import CancelIcon from '@material-ui/icons/Clear';
import { DateTimePicker } from '@material-ui/pickers';

import { selectors as invitesSelectors, actions as invitesActions } from './invitesSlice';
import { actions as appActions, selectors as appSelectors } from '../app/appSlice';
import { actions as videoActions, selectors as videoSelectors } from '../videoIframe/videoSlice';
import { DateTime } from 'luxon';

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

const ConfirmDialog = ({ open, title = 'Confirm', text = 'Are you sure?', onCancel, onConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {text}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InvitesFrom = () => {
  const { authUser } = useSelector(appSelectors.select);
  const { error, isLoading, showNewDialog, email, displayName, date } = useSelector(invitesSelectors.select);
  const invitesFrom = useSelector(invitesSelectors.selectInvitesFrom);
  const dispatch = useDispatch();

  const [toConfirm, setToConfirm] = useState(null);

  useEffect(() => {
    const go = async () => {
      dispatch(invitesActions.getInvitesFrom());
    };
    if (authUser.uid) go();
  }, [authUser, dispatch]);

  const DeleteButton = ({ params }) => (
    <Button
      onClick={() => {
        const { uid } = params.data;
        setToConfirm({ uid });
      }}
    >
      <DeleteIcon />
    </Button>
  );

  const EditButton = ({ params }) => (
    <Button disabled onClick={() => {
      const { uid } = params.data;
      // dispatch(invitesActions.deleteInvite({ uid }));
    }}>
      <EditIcon />
    </Button>
  )

  const LaunchButton = ({ params }) => {
    const { uid } = params.data;
    return (
      <Button
        color="primary" variant="contained"
        onClick={() => dispatch(videoActions.launch({ uid }))}
      >
        Launch
      </Button>
    )
  };

  const EndButton = ({ params }) => {
    const { uid } = params.data;
    return (
      <Button
        color="primary" variant="contained"
        onClick={() => dispatch(videoActions.end({ uid }))}
      >
        End
      </Button>
    );
  }

  const columns = [
    { field: 'displayName', headerName: 'To', width: 120 },
    { field: 'email', headerName: 'Email', width: 120 },
    {
      field: 'date', headerName: 'When', width: 220,
      valueFormatter: ({ value }) => DateTime.fromISO(value).toLocal().toLocaleString(DateTime.DATETIME_SHORT)
    },
    { field: 'accepted', headerName: 'Accepted', width: 100 },
    {
      field: '',
      headerName: 'Actions',
      flex: 1,
      disableClickEventBubbling: true,
      renderCell: (params) => {
        return (
          <div>
            <DeleteButton params={params} />
            <EditButton params={params} />
            {!params.data.inProgress && (<LaunchButton params={params} />)}
            {params.data.inProgress && (<EndButton params={params} />)}
          </div>
        )
      }
    }
  ];

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(invitesActions.createInvite());
  };

  return (
    <div>
      <div>
        <Button onClick={() => dispatch(invitesActions.getInvitesFrom())}>
          <CachedIcon />
        </Button>
        <Button onClick={() => dispatch(invitesActions.setShowNewDialog(true))}>
          <AddIcon />
        </Button>
      </div>
      <div style={{ height: 300 }}>
        <DataGrid
          rows={invitesFrom}
          columns={columns}
        />
      </div>

      <ConfirmDialog
        text="Are you sure you want to delete this invitation?"
        open={!!toConfirm} onCancel={() => setToConfirm(null)}
        onConfirm={async () => {
          await dispatch(invitesActions.deleteInvite(toConfirm));
          setToConfirm(null);
        }}
      />

      <Dialog
        open={showNewDialog}
        onClose={() => dispatch(invitesActions.setShowNewDialog(false))}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Create New Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Who would you like to invite?
          </DialogContentText>
          <form onSubmit={onSubmit}>
            <TextField
              fullWidth autoFocus
              variant="filled" label="Student Name" placeholder="Student Name"
              id="displayName" value={displayName}
              onChange={({ target: { value } }) => dispatch(invitesActions.setDisplayName(value))}
            />
            <TextField
              fullWidth
              variant="filled" label="Student Email" placeholder="Student Email"
              id="email" value={email}
              onChange={({ target: { value } }) => dispatch(invitesActions.setEmail(value))}
            />
            <DateTimePicker value={date} onChange={value => dispatch(invitesActions.setDate(value))} />
            <button className="invisible" type="submit" />
          </form>
          {!!error && <Alert severity="error">{error.message}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => dispatch(invitesActions.setShowNewDialog(false))} color="primary">
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
  const invitesTo = useSelector(invitesSelectors.selectInvitesTo);
  const dispatch = useDispatch();

  useEffect(() => {
    const go = async () => {
      dispatch(invitesActions.getInvitesTo());
    };
    if (authUser.uid) go();
  }, [authUser, dispatch]);

  const AcceptButton = ({ params }) => (
    <Button
      onClick={() => {
        const { uid } = params.data;
        dispatch(invitesActions.updateInvite({ uid, update: { accepted: true } }));
      }}
    >
      <AcceptIcon/>
    </Button>
  );

  const RejectButton = ({ params }) => (
    <Button
      onClick={() => {
        const { uid } = params.data;
        dispatch(invitesActions.updateInvite({ uid, update: { accepted: false } }));
      }}
    >
      <CancelIcon />
    </Button>
  );

  const JoinButton = ({ params }) => {
    console.log(params.data);
    const { room } = params.data;
    return (
      <Button
        color="primary" variant="contained"
        onClick={() => dispatch(videoActions.join(room))}
      >
        Join
      </Button>
    )
  };

  const columns = [
    { field: 'displayName', headerName: 'To', width: 120 },
    { field: 'email', headerName: 'Email', width: 120 },
    {
      field: 'date', headerName: 'When', width: 220,
      valueFormatter: ({ value }) => DateTime.fromISO(value).toLocal().toLocaleString(DateTime.DATETIME_SHORT)
    },
    {
      field: '',
      headerName: 'Actions',
      flex: 1,
      disableClickEventBubbling: true,
      renderCell: (params) => {
        return (
          <div>
            {!params.data.accepted && <AcceptButton params={params} />}
            {params.data.accepted && <RejectButton params={params} />}
            {params.data.inProgress && (<JoinButton params={params} />)}
          </div>
        )
      }
    }
  ];

  return (
    <div>
      <div>
        <Button onClick={() => dispatch(invitesActions.getInvitesTo())}>
          <CachedIcon />
        </Button>
      </div>
      <div style={{ height: 300 }}>
        <DataGrid
          rows={invitesTo}
          columns={columns}
        />
      </div>
    </div>
  );
};

export { InvitesFrom, InvitesTo };
