import React from 'react';

import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';

const ItemDetails = ({ item }) => (
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(item).map(([name, value], index) => (
          <TableRow key={index}>
            <TableCell>
              {name}
            </TableCell>
            <TableCell>
              {
                    Array.isArray(value)
                      ? (
                        <>
                          {value.length}
                          {' '}
                          items
                        </>
                      )
                      : <>{value.toString()}</>
                  }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default ItemDetails;
