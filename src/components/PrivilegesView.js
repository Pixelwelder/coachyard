import React from 'react';
import USER_PRIVILEGES from '../constants/userPrivileges';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import userPrivileges from '../constants/userPrivileges';


const PrivilegesView = ({ privileges = 0 }) => {
  const allPrivileges = Object.entries(userPrivileges)
    .sort(([n1, v1], [n2, v2]) => v1 - v2)
    .map(([name, value]) => [name, ((privileges & value) === value).toString()]);

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Privilege</TableCell>
            <TableCell>Owned</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allPrivileges.map(([name, value], index) => {
            return (
              <TableRow key={index}>
                <TableCell>
                  {name}
                </TableCell>
                <TableCell>
                  {value}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default PrivilegesView;
