import React from 'react';
import { Drawer, useMediaQuery, useTheme } from '@mui/material';
import ReservationDetailContent from './ReservationDetailContent';

export default function ReservationDetailDrawer({ open, onClose, reservation, onSaved }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isXs ? '100%' : { sm: 440, md: 480 },
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
        },
        role: 'dialog',
        'aria-modal': true,
      }}
    >
      <ReservationDetailContent reservation={reservation} showClose onClose={onClose} onSaved={onSaved} />
    </Drawer>
  );
}

