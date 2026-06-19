import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

/** Label left, value right — readable drawer rows. */
export function DetailRow({ label, value, valueSx, align = 'split' }) {
  if (value == null || value === '') return null;

  if (align === 'inline') {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {label}:{' '}
        </Box>
        <Box component="span" sx={{ wordBreak: 'break-all', ...valueSx }}>
          {value}
        </Box>
      </Typography>
    );
  }

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      sx={{ py: 0.65, borderBottom: '1px solid', borderColor: 'grey.100', '&:last-of-type': { borderBottom: 0 } }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flexShrink: 0, fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.4 }}
      >
        {label}
      </Typography>
      <Box
        component="div"
        sx={{
          textAlign: 'right',
          minWidth: 0,
          flex: 1,
          fontWeight: 600,
          fontSize: '0.8125rem',
          lineHeight: 1.4,
          color: 'text.primary',
          wordBreak: 'break-word',
          ...valueSx,
        }}
      >
        {value}
      </Box>
    </Stack>
  );
}

export function SectionCard({ title, children, sx }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
        ...sx,
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
      <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.paper' }}>{children}</Box>
    </Box>
  );
}
