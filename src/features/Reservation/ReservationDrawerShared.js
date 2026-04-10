import React from 'react';
import { Box, Typography } from '@mui/material';

export function DetailRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
      <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {label}:{' '}
      </Box>
      <Box component="span" sx={{ wordBreak: 'break-all' }}>
        {value}
      </Box>
    </Typography>
  );
}

export function SectionCard({ title, children }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          px: 2,
          py: 1,
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.06em',
        }}
        component="div"
      >
        {title}
      </Box>
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>{children}</Box>
    </Box>
  );
}
