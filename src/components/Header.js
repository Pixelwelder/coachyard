import React from 'react';
import Typography from '@material-ui/core/Typography';
import User from '../features/user';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: 8,
    marginBottom: 16
  },
  titleContainer: {
    flex: 1
  },
  userContainer: {
    flex: 0
  },
  title: {
    textTransform: 'uppercase'
  }
});

const Header = () => {
  const styles = useStyles();

  return (
    <Box borderBottom={1} borderColor="lightgray" className={styles.container}>
      <Box className={styles.titleContainer}>
        <Typography variant="h3" className={styles.title}>Coachyard</Typography>
      </Box>

      <Box className={styles.userContainer}>
        <User />
      </Box>
    </Box>
  );
};

export default Header;
