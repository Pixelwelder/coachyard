import React, { useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import { Redirect, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { selectors as selectedCourseSelectors } from './selectedCourseSlice';
import { useDispatch, useSelector } from 'react-redux';
import { SizeMe } from 'react-sizeme';
import ProcessingMode from './ProcessingMode';
import ViewingMode from './ViewingMode';
import LiveMode from './LiveMode';
import InitializingMode from './InitializingMode';
import ScheduledMode from './ScheduledMode';
import NoItem from './NoItem';
import { selectHasAccessToCurrentCourse } from '../app/comboSelectors';
import { Typography } from '@material-ui/core';

const Locked = () => {
  return (
    <div className="centered-mode">
      <Typography>Purchase this course to unlock this item.</Typography>
    </div>
  );
};

const ItemView = () => {
  const { selectedItem: item } = useSelector(selectedCourseSelectors.select);
  const location = useLocation();
  const query = queryString.parse(location.search);
  const hasAccess = useSelector(selectHasAccessToCurrentCourse);
  const { barebones } = query;

  useEffect(() => {
    // dispatch(uiActions2.editItem.reset());
  }, [item]);

  return (
    <Paper className="item-view" variant="outlined">
      <SizeMe
        monitorHeight
        monitorPosition
        refreshRate={500}
      >
        {({ size }) => (
          <div className={`item-view-content item-view-content-${item?.status || ''}`}>
            {
              hasAccess
                ? (<>
                  {!item && <NoItem />}
                  {item && (
                    <>
                      {item.status === 'scheduled' && <ScheduledMode />}
                      {item.status === 'initializing' && <InitializingMode />}
                      {item.status === 'live' && (
                        <>
                          {
                            barebones === 'true'
                              ? <Redirect to={`/barebones?id=${item.uid}`} />
                              : <LiveMode size={size} />
                          }
                        </>
                      )}
                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <ProcessingMode status={item.status} />
                      )}
                      {item.status === 'viewing' && <ViewingMode size={size} />}
                    </>
                  )}
                  </>)
                : (
                  <Locked />
                )
            }
          </div>
        )}
      </SizeMe>
    </Paper>
  );
};

export default ItemView;
