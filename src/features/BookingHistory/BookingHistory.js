import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Skeleton,
  TablePagination,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Breadcrumb } from '../../components/index';
import { CustomSelectField } from '../../components/ReactHookForm';
import { listHotel } from '../CalendarView/CalendarViewApi';
import { fetchBookingHistoryPage } from './BookingHistoryApi';
import BookingDetailDrawer from './BookingDetailDrawer';
import BookingHistoryCard from './BookingHistoryCard';
import './BookingHistory.scss';
import { bookingRowKey } from './bookingHistoryUtils';

const ROWS_OPTIONS = [10, 25, 50];

function BookingHistory() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { control } = useForm();
  const [optionsHotel, setOptionsHotel] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [checkInFilter, setCheckInFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const hotelsLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listHotel({ data: {}, dispatch });
      if (cancelled) return;
      const opts = Array.isArray(res) ? res.map((item) => ({ label: item.hotelName, value: item.hotelId })) : [];
      setOptionsHotel(opts);
      if (!hotelsLoaded.current && opts.length > 0) {
        hotelsLoaded.current = true;
        setSelectedHotel((prev) => prev || opts[0].value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const loadBookings = useCallback(async () => {
    if (!selectedHotel) {
      setRows([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const checkInDate =
      checkInFilter && dayjs.isDayjs(checkInFilter) && checkInFilter.isValid()
        ? checkInFilter.format('YYYY-MM-DD')
        : '';
    const { data, total: tTotal } = await fetchBookingHistoryPage({
      hotelId: selectedHotel,
      page,
      perPage: rowsPerPage,
      dispatch,
      checkInDate,
      statusFilter,
      channelFilter,
    });
    setRows(data);
    setTotal(tTotal);
    setLoading(false);
  }, [selectedHotel, page, rowsPerPage, dispatch, checkInFilter, statusFilter, channelFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleHotelChange = (e) => {
    setSelectedHotel(e.target.value);
    setPage(0);
    setSelectedRow(null);
    setDetailOpen(false);
  };

  const handleClearFilters = () => {
    setCheckInFilter(null);
    setStatusFilter('ALL');
    setChannelFilter('ALL');
    setPage(0);
    setSelectedRow(null);
    setDetailOpen(false);
  };

  const openDetail = (row) => {
    setSelectedRow(row);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
  };

  return (
    <div className="booking-history-page page">
      <Breadcrumb
        className="breadcrumb-wrapper--trail-only"
        breadcrumbList={[
          { title: t('Home'), url: '/' },
          { title: t('Reservation'), url: '/manage-reservation' },
          { title: t('Booking Database'), url: '/booking-database' },
        ]}
      />

      <div className="card-wrapper-default booking-history-card">
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#334155' }}>
          {t('Booking Database')}
        </Typography>

        <Stack spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ maxWidth: { xs: '100%', sm: 480 } }}>
            <CustomSelectField
              id="bookingHistoryHotelId"
              label={t('Hotel')}
              control={control}
              variant="outlined"
              size="small"
              options={optionsHotel}
              values={selectedHotel}
              handleCustomInputChange={handleHotelChange}
            />
          </Box>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
              <DatePicker
                label={t('Check-in date filter')}
                value={checkInFilter}
                onChange={(v) => {
                  setCheckInFilter(v);
                  setPage(0);
                  setSelectedRow(null);
                  setDetailOpen(false);
                }}
                renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 220 }} />}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="booking-history-status-filter">{t('Booking status')}</InputLabel>
                <Select
                  labelId="booking-history-status-filter"
                  label={t('Booking status')}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                    setSelectedRow(null);
                    setDetailOpen(false);
                  }}
                >
                  <MenuItem value="ALL">{t('All statuses')}</MenuItem>
                  <MenuItem value="CONFIRMED">{t('Confirmed')}</MenuItem>
                  <MenuItem value="CANCELLED">{t('Cancelled')}</MenuItem>
                  <MenuItem value="COMPLETED">{t('Completed')}</MenuItem>
                  <MenuItem value="PENDING">{t('Pending')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="booking-history-channel-filter">{t('Sales channel')}</InputLabel>
                <Select
                  labelId="booking-history-channel-filter"
                  label={t('Sales channel')}
                  value={channelFilter}
                  onChange={(e) => {
                    setChannelFilter(e.target.value);
                    setPage(0);
                    setSelectedRow(null);
                    setDetailOpen(false);
                  }}
                >
                  <MenuItem value="ALL">{t('All channels')}</MenuItem>
                  <MenuItem value="CONTROL_PANEL">{t('Control panel')}</MenuItem>
                  <MenuItem value="WEBSITE">{t('Website')}</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" size="medium" onClick={handleClearFilters} sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}>
                {t('Clear filters')}
              </Button>
            </Stack>
          </LocalizationProvider>
        </Stack>

        {!selectedHotel && (
          <Typography color="text.secondary" variant="body2">
            {t('Select a hotel to load bookings')}
          </Typography>
        )}

        {selectedHotel && loading && (
          <Box className="booking-history-skeleton-stack booking-history-card-grid">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} variant="rounded" height={120} sx={{ borderRadius: 2, width: '100%' }} />
            ))}
          </Box>
        )}

        {selectedHotel && !loading && rows.length === 0 && (
          <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
            {t('No bookings found for this hotel')}
          </Typography>
        )}

        {selectedHotel && !loading && rows.length > 0 && (
          <>
            <Box className="booking-history-list booking-history-card-grid">
              {rows.map((row) => {
                const oid = row.orderId || row.reservationId || '—';
                const rowKey = bookingRowKey(row) ?? oid;
                const selKey = bookingRowKey(selectedRow);
                const rowStableKey = bookingRowKey(row);
                const isActive =
                  detailOpen &&
                  selKey != null &&
                  rowStableKey != null &&
                  selKey === rowStableKey;
                return (
                  <Box key={rowKey} sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
                    <BookingHistoryCard
                      row={row}
                      isActive={isActive}
                      onOpen={openDetail}
                      t={t}
                    />
                  </Box>
                );
              })}
            </Box>

            <Box className="booking-history-pagination-wrap">
              <TablePagination
                className="booking-history-pagination"
                component="div"
                count={total}
                page={page}
                onPageChange={(_, p) => {
                  setPage(p);
                  setSelectedRow(null);
                  setDetailOpen(false);
                }}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                  setSelectedRow(null);
                  setDetailOpen(false);
                }}
                rowsPerPageOptions={ROWS_OPTIONS}
                labelRowsPerPage={t('')}
                SelectProps={{
                  size: 'small',
                  variant: 'outlined',
                  MenuProps: { disableScrollLock: true },
                }}
              />
            </Box>
          </>
        )}
      </div>

      <BookingDetailDrawer open={detailOpen} onClose={closeDetail} booking={selectedRow} />
    </div>
  );
}

export default BookingHistory;
