import React, { useEffect, useRef } from 'react';
import { Drawer, useMediaQuery, useTheme } from '@mui/material';
import BookingDetailContent from './BookingDetailContent';

export default function BookingDetailDrawer({ open, onClose, booking }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => closeBtnRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const titleId = 'booking-detail-drawer-title';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isXs ? '100%' : { sm: 420, md: 520 },
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
        },
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': titleId,
      }}
    >
      <BookingDetailContent
        booking={booking}
        showClose
        onClose={onClose}
        titleId={titleId}
        closeBtnRef={closeBtnRef}
      />
    </Drawer>
  );
}
