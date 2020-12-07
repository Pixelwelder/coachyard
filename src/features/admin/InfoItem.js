import React, { useState } from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import { ItemDetails } from './ItemDetails';

const InfoItem = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Accordion expanded={isExpanded} onChange={(event, isExpanded) => setIsExpanded(isExpanded)}>
      <AccordionSummary>
        <Typography>Item Details</Typography>
      </AccordionSummary>
      <AccordionDetails style={{ display: 'flex', flexFlow: 'column nowrap' }}>
        <ItemDetails item={item} />
      </AccordionDetails>
    </Accordion>
  );
};

export default InfoItem;
