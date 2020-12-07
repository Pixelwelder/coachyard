import React, { useEffect, useState } from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Alert from '@material-ui/lab/Alert';
import app from 'firebase';
import { ItemDetails } from './ItemDetails';
import Button from '@material-ui/core/Button';

const VideoDisplay = ({ id }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [item, setItem] = useState(undefined);

  useEffect(() => {
    const go = async (id) => {
      const composites = app.functions().httpsCallable('compositesFE');
      const result = await composites({ id });
      setItem(result.data.result.newest_composite);
    };
    if (id) {
      go(id);
    }
  }, [id]);

  const send = async (item) => {
    console.log('sending', id);
    const compositesFE = app.functions().httpsCallable('compositesFE');
    const result = await compositesFE({
      method: 'post',
      id
    });
    console.log(result);
  };

  return (
    <Accordion expanded={isExpanded} onChange={(event, isExpanded) => setIsExpanded(isExpanded)}>
      <AccordionSummary>
        <Typography>Composite</Typography>
      </AccordionSummary>
      <AccordionDetails style={{ height: 400, flexFlow: 'column' }}>
        {!item && <Alert severity="error">No composite.</Alert>}
        {!!item && (
          <>
            <ItemDetails item={item}/>
            <Button onClick={() => send(item)}>Send to Mux</Button>
          </>
        )}
        {/*<a href={``}*/}
      </AccordionDetails>
    </Accordion>
  );
};

export default VideoDisplay;
