import React, { useEffect, useState } from 'react';
import app from 'firebase/app';

import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import ReactPlayer from 'react-player';
import InfoItem from './InfoItem';
import TracksDisplay from './TracksDisplay';
import VideoDisplay from './VideoDisplay';

const trackColumns = [
  { field: 'name', headerName: 'Name', width: 220 },
];

const Info = ({ item, onClose }) => {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Dialog open={!!item} onClose={onClose} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{item?.room_name || 'Item'}</DialogTitle>
      <DialogContent>
        {!!item && (
          <>
            <InfoItem item={item} />
            <TracksDisplay tracks={item.tracks} />
            <VideoDisplay id={item.id} />
            {/*{item.tracks && (*/}
            {/*  <Select*/}
            {/*    labelId="tracks-label"*/}
            {/*    id="tracks-select"*/}
            {/*    value={tabValue}*/}
            {/*    onChange={({ target: { value } }) => setTabValue(value)}*/}
            {/*  >*/}
            {/*    {item.tracks.map((track, index) => {*/}
            {/*      return <MenuItem value={index} key={index}>{index}</MenuItem>;*/}
            {/*    })}*/}
            {/*  </Select>*/}
            {/*)}*/}
            {/*<Tabs value={tabValue} onChange={(event, newValue) => setTabValue(newValue)}>*/}
            {/*  {item.tracks.map((track, index) => {*/}
            {/*    return (<Tab label={index} key={index} />);*/}
            {/*  })}*/}
            {/*</Tabs>*/}
            {/*{Object.entries((item?.tracks || [])[tabValue]).map(([name, value], index) => {*/}
            {/*  return (*/}
            {/*    <div style={{ display: 'flex' }} key={index}>*/}
            {/*      <span>{name}: </span>*/}
            {/*      <span>{value.toString()}</span>*/}
            {/*    </div>*/}
            {/*  );*/}
            {/*})}*/}
            <ReactPlayer
              url={`https://api.daily.co/v1/recordings/0526c677-f214-41ba-8ead-53ed1ec3f8ae/composites/17c60468-79d4-4e3a-ff87-9ef161e2f60a.mp4`}
            />
            {/*<a href={`https://api.daily.co${item.tracks[tabValue].download_url}`} target="_blank">Download</a>*/}
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
