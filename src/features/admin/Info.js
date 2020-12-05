import React, { useState } from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { DataGrid } from '@material-ui/data-grid';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Input from '@material-ui/core/Input';
import FormControl from '@material-ui/core/FormControl';

const trackColumns = [
  { field: 'name', headerName: 'Name', width: 220 },
];

const Info = ({ item, onClose }) => {
  console.log(item);
  const [tabValue, setTabValue] = useState(0);



  return (
    <Dialog open={!!item} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">Info</DialogTitle>
      <DialogContent>
        {!!item && (
          <>
            <p>{item.room_name}</p>
            {Object.entries(item).map(([name, value], index) => {
              return (
                <div style={{ display: 'flex' }} key={index}>
                  <span>{name}: </span>
                  <span>{value.toString()}</span>
                </div>
              );
            })}
            <Tabs value={tabValue} onChange={(event, newValue) => setTabValue(newValue)}>
              {item.tracks.map((track, index) => {
                return (<Tab label={index} key={index} />);
              })}
            </Tabs>
            {Object.entries(item.tracks[tabValue]).map(([name, value], index) => {
              return (
                <div style={{ display: 'flex' }} key={index}>
                  <span>{name}: </span>
                  <span>{value.toString()}</span>
                </div>
              );
            })}
          </>
        )}

        {/*<DataGrid*/}
        {/*  rows={items}*/}
        {/*  columns={columns}*/}
        {/*  // rowHeight={}*/}
        {/*  // headerHeight={}*/}
        {/*  // scrollbarSize={}*/}
        {/*  // columnBuffer={}*/}
        {/*  // sortingOrder={}*/}
        {/*  // icons={}*/}
        {/*  // columnTypes={}*/}
        {/*/>*/}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Info;
