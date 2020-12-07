import React, { useState } from 'react';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Accordion from '@material-ui/core/Accordion';
import { DataGrid } from '@material-ui/data-grid';

const columns = [
  { field: 'type', headerName: 'Type' },
  { field: 'user_name', headerName: 'User' },
  {
    field: 'duration',
    headerName: 'Duration',
    valueFormatter: ({ value }) => `${value.toFixed(1)}s`
  }
  // {
  //   field: '',
  //   headerName: 'Actions',
  //   width: 300,
  //   disableClickEventBubbling: true,
  //   // renderCell: () => {}
  // }
];

const TracksDisplay = ({ tracks }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Accordion expanded={isExpanded} onChange={(event, isExpanded) => setIsExpanded(isExpanded)}>
      <AccordionSummary>
        <Typography>Tracks</Typography>
      </AccordionSummary>
      <AccordionDetails style={{ height: 400 }}>
        <DataGrid rows={tracks} columns={columns} />
      </AccordionDetails>
    </Accordion>
  );
};

export default TracksDisplay;
