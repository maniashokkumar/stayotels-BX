import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PreviewOutlinedIcon from '@mui/icons-material/PreviewOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Breadcrumb } from '../../components/index';
import { CustomSelectField } from '../../components/ReactHookForm';
import { listHotel } from '../CalendarView/CalendarViewApi';
import {
  buildReportPayload,
  downloadReportExcel,
  openReportPdfInNewTab,
  parseReportApiError,
  previewReport,
} from './ReportsApi';
import { DATE_BASIS_OPTIONS, PAYMENT_STATUS_OPTIONS, REPORT_TYPES } from './reportTypes';
import './ReportsPage.scss';

const MONEY_COLUMNS = new Set([
  'preTax',
  'roomPreTax',
  'mealPreTax',
  'mealGst',
  'gst',
  'cgst',
  'sgst',
  'grossTotal',
  'supplements',
  'refunds',
  'taxableValue',
  'gstTotal',
  'gstAmount',
  'collected',
  'pending',
]);

const INTEGER_COLUMNS = new Set(['bookings', 'rooms', 'nights', 'lineCount', 'gstRatePercent']);

const HIDDEN_COLUMNS = new Set(['hotelId']);

function formatPaymentStatus(value, t) {
  const v = String(value || '').toUpperCase();
  if (v === 'NOT_PAID') return t('Not paid');
  if (v === 'PARTIALLY_PAID') return t('Partially paid');
  if (v === 'FULLY_PAID') return t('Fully paid');
  return value ? String(value) : '—';
}

function formatCell(value, col, t) {
  if (value === '') {
    return '';
  }
  if (value === null || value === undefined) {
    return '—';
  }
  if (value === 'TOTAL') {
    return t('TOTAL');
  }
  if (col === 'paymentStatus') {
    return formatPaymentStatus(value, t);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number' && INTEGER_COLUMNS.has(col)) {
    return Math.round(value).toLocaleString('en-IN');
  }
  if (typeof value === 'number' && MONEY_COLUMNS.has(col)) {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return String(value);
}

function visibleColumns(columns) {
  return (columns || []).filter((col) => !HIDDEN_COLUMNS.has(col));
}

function isNumericColumn(col) {
  return MONEY_COLUMNS.has(col) || INTEGER_COLUMNS.has(col);
}

function columnLabel(col) {
  return col
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function FilterSection({ title, children }) {
  return (
    <Box className="reports-filter-section">
      <Typography className="reports-filter-section__title" variant="overline">
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const permissions = JSON.parse(localStorage.getItem('roles') || '[]');
  const canViewReports = permissions.includes('REPORT:VIEW');
  const { control } = useForm();
  const [hotelOptions, setHotelOptions] = useState([{ label: t('All hotels'), value: 'all' }]);
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [reportType, setReportType] = useState('MONTHLY_REVENUE');
  const [dateBasis, setDateBasis] = useState('CHECK_IN');
  const [dateFrom, setDateFrom] = useState(dayjs().startOf('month'));
  const [dateTo, setDateTo] = useState(dayjs());
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [salesChannel, setSalesChannel] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listHotel({ data: {}, dispatch });
      if (cancelled) return;
      const opts = Array.isArray(res)
        ? res.map((item) => ({ label: item.hotelName, value: item.hotelId }))
        : [];
      setHotelOptions([{ label: t('All hotels'), value: 'all' }, ...opts]);
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, t]);

  const payload = useMemo(
    () =>
      buildReportPayload({
        reportType,
        hotelId: selectedHotel,
        dateFrom: dateFrom?.isValid?.() ? dateFrom.format('YYYY-MM-DD') : '',
        dateTo: dateTo?.isValid?.() ? dateTo.format('YYYY-MM-DD') : '',
        dateBasis,
        includeCancelled,
        salesChannel,
        paymentStatus,
      }),
    [reportType, selectedHotel, dateFrom, dateTo, dateBasis, includeCancelled, salesChannel, paymentStatus]
  );

  const selectedReportMeta = REPORT_TYPES.find((r) => r.value === reportType);
  const isGstReport = Boolean(selectedReportMeta?.gstReport);

  const applyPeriodPreset = (preset) => {
    const today = dayjs();
    if (preset === 'this_month') {
      setDateFrom(today.startOf('month'));
      setDateTo(today);
    } else if (preset === 'last_month') {
      const last = today.subtract(1, 'month');
      setDateFrom(last.startOf('month'));
      setDateTo(last.endOf('month'));
    } else if (preset === 'last_7') {
      setDateFrom(today.subtract(6, 'day'));
      setDateTo(today);
    }
    setPreview(null);
  };

  const runPreview = useCallback(async () => {
    if (!dateFrom?.isValid?.() || !dateTo?.isValid?.()) {
      setError(t('Please select a valid date range.'));
      return;
    }
    if (dateTo.isBefore(dateFrom, 'day')) {
      setError(t('End date must be on or after start date.'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await previewReport(payload);
      setPreview(data);
    } catch (e) {
      const msg = parseReportApiError(e, t('Failed to load report preview.'));
      setPreview(null);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [payload, dateFrom, dateTo, t]);

  const handleExcel = async () => {
    if (!preview) return;
    setExporting('excel');
    setError('');
    try {
      await downloadReportExcel(payload);
    } catch {
      setError(t('Excel export failed.'));
    } finally {
      setExporting('');
    }
  };

  const handlePdf = async () => {
    if (!preview) return;
    setExporting('pdf');
    setError('');
    try {
      await openReportPdfInNewTab(payload);
    } catch (e) {
      if (e?.code === 'POPUP_BLOCKED' || e?.message === 'POPUP_BLOCKED') {
        setError(t('Allow pop-ups for this site to view the PDF, then try again.'));
      } else {
        setError(t('PDF export failed.'));
      }
    } finally {
      setExporting('');
    }
  };

  const columns = visibleColumns(preview?.columns || []);
  const rows = preview?.rows || [];
  const totals = preview?.totals;
  const reportTitle = selectedReportMeta ? t(selectedReportMeta.labelKey) : t('Reports');

  if (!canViewReports) {
    return (
      <div className="reports-page page">
        <Breadcrumb
          className="breadcrumb-wrapper--trail-only"
          rmMargin
          breadcrumbList={[
            { title: t('Home'), url: '/' },
            { title: t('Reports'), url: '/reports' },
          ]}
        />
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('You do not have permission to view reports.')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="reports-page page">
      <Breadcrumb
        className="breadcrumb-wrapper--trail-only"
        rmMargin
        breadcrumbList={[
          { title: t('Home'), url: '/' },
          { title: t('Reports'), url: '/reports' },
        ]}
      />

      <Grid container columnSpacing={2.5} rowSpacing={2.5} className="reports-layout">
        <Grid item xs={12} lg={4} xl={3.5}>
          <Paper className="reports-filters card-wrapper-default" elevation={0}>
            <FilterSection title={t('Report')}>
              <FormControl fullWidth size="small">
                <InputLabel id="report-type-label">{t('Report type')}</InputLabel>
                <Select
                  labelId="report-type-label"
                  label={t('Report type')}
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setPreview(null);
                  }}
                >
                  {REPORT_TYPES.map((rt) => (
                    <MenuItem key={rt.value} value={rt.value}>
                      {t(rt.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedReportMeta && (
                <Typography className="reports-hint" variant="caption" color="text.secondary">
                  {t(selectedReportMeta.descriptionKey)}
                </Typography>
              )}
            </FilterSection>

            <Divider className="reports-divider" />

            <FilterSection title={t('Property')}>
              <CustomSelectField
                id="reportsHotelId"
                label={t('Hotel')}
                control={control}
                variant="outlined"
                size="small"
                options={hotelOptions}
                values={selectedHotel}
                handleCustomInputChange={(e) => {
                  setSelectedHotel(e.target.value);
                  setPreview(null);
                }}
              />
            </FilterSection>

            <Divider className="reports-divider" />

            <FilterSection title={t('Period')}>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Chip
                  label={t('This month')}
                  size="small"
                  variant="outlined"
                  onClick={() => applyPeriodPreset('this_month')}
                  className="reports-period-chip"
                />
                <Chip
                  label={t('Last month')}
                  size="small"
                  variant="outlined"
                  onClick={() => applyPeriodPreset('last_month')}
                  className="reports-period-chip"
                />
                <Chip
                  label={t('Last 7 days')}
                  size="small"
                  variant="outlined"
                  onClick={() => applyPeriodPreset('last_7')}
                  className="reports-period-chip"
                />
              </Stack>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label={t('From')}
                      value={dateFrom}
                      onChange={(v) => {
                        setDateFrom(v);
                        setPreview(null);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth className="reports-date-field" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label={t('To')}
                      value={dateTo}
                      onChange={(v) => {
                        setDateTo(v);
                        setPreview(null);
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" fullWidth className="reports-date-field" />
                      )}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </FilterSection>

            <Divider className="reports-divider" />

            <FilterSection title={t('Options')}>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel id="date-basis-label">{t('Date basis')}</InputLabel>
                <Select
                  labelId="date-basis-label"
                  label={t('Date basis')}
                  value={dateBasis}
                  onChange={(e) => {
                    setDateBasis(e.target.value);
                    setPreview(null);
                  }}
                >
                  {DATE_BASIS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel id="reports-payment-status-label">{t('Payment status')}</InputLabel>
                <Select
                  labelId="reports-payment-status-label"
                  label={t('Payment status')}
                  value={paymentStatus}
                  onChange={(e) => {
                    setPaymentStatus(e.target.value);
                    setPreview(null);
                  }}
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel id="reports-channel-label">{t('Sales channel')}</InputLabel>
                <Select
                  labelId="reports-channel-label"
                  label={t('Sales channel')}
                  value={salesChannel}
                  onChange={(e) => {
                    setSalesChannel(e.target.value);
                    setPreview(null);
                  }}
                >
                  <MenuItem value="all">{t('All channels')}</MenuItem>
                  <MenuItem value="CONTROL_PANEL">{t('Control panel')}</MenuItem>
                  <MenuItem value="WEBSITE">{t('Website')}</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                className="reports-checkbox"
                control={
                  <Checkbox
                    size="small"
                    checked={includeCancelled}
                    onChange={(e) => {
                      setIncludeCancelled(e.target.checked);
                      setPreview(null);
                    }}
                  />
                }
                label={t('Include cancelled bookings')}
              />
            </FilterSection>

            {isGstReport && (
              <Alert severity="info" className="reports-info-alert" icon={false}>
                {t(
                  'GST uses stay night dates in the period. Unpaid bookings are excluded by default (for month-end GST). Partially and fully paid stays are included. Use Payment status to change this.'
                )}
              </Alert>
            )}
            {!isGstReport && dateBasis === 'PAYMENT_DATE' && (
              <Alert severity="info" className="reports-info-alert" icon={false}>
                {t(
                  'Payment date includes bookings with any payment in the period. Rows use the latest payment date within that period.'
                )}
              </Alert>
            )}

            <Box className="reports-actions">
              <Button
                fullWidth
                variant="contained"
                size="medium"
                startIcon={<PreviewOutlinedIcon />}
                onClick={runPreview}
                disabled={loading}
              >
                {loading ? t('Loading...') : t('Preview')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8} xl={8.5}>
          <Paper className="reports-results card-wrapper-default" elevation={0}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!preview && !error && (
              <Box className="reports-empty">
                <AssessmentOutlinedIcon className="reports-empty__icon" />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('No preview yet')}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {t('Configure filters on the left and click Preview to see your report here.')}
                </Typography>
              </Box>
            )}

            {preview && (
              <>
                <Box className="reports-results-header">
                  <Box className="reports-results-header__meta">
                    <Typography variant="subtitle1" fontWeight={600}>
                      {reportTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dateFrom?.format?.('DD MMM YYYY')} — {dateTo?.format?.('DD MMM YYYY')}
                      {' · '}
                      {isGstReport
                        ? t('Stay night (supply date)')
                        : t(DATE_BASIS_OPTIONS.find((o) => o.value === dateBasis)?.labelKey || '')}
                    </Typography>
                  </Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                    className="reports-results-header__actions"
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<FileDownloadOutlinedIcon />}
                      onClick={handleExcel}
                      disabled={!!exporting}
                    >
                      {exporting === 'excel' ? t('Exporting...') : t('Download Excel')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PictureAsPdfOutlinedIcon />}
                      onClick={handlePdf}
                      disabled={!!exporting}
                    >
                      {exporting === 'pdf' ? t('Opening...') : t('View PDF')}
                    </Button>
                  </Stack>
                </Box>

                {preview.truncated && preview.truncatedMessage && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {preview.truncatedMessage}
                  </Alert>
                )}
                {preview.paymentNote && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {preview.paymentNote}
                  </Alert>
                )}
                {preview.dateBasisNote && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {preview.dateBasisNote}
                  </Alert>
                )}
                {preview.legacyGstBookingCount > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t(
                      '{{count}} booking(s) without per-night GST breakdown are included using prorated stay-night totals (legacy data).',
                      { count: preview.legacyGstBookingCount }
                    )}
                  </Alert>
                )}

                <TableContainer className="reports-table-wrap">
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {columns.map((col) => (
                          <TableCell
                            key={col}
                            align={isNumericColumn(col) ? 'right' : 'left'}
                            className="reports-table-head-cell"
                          >
                            {columnLabel(col)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, idx) => (
                        <TableRow key={idx} hover className="reports-table-row">
                          {columns.map((col) => (
                            <TableCell
                              key={col}
                              align={isNumericColumn(col) ? 'right' : 'left'}
                              className={isNumericColumn(col) ? 'reports-table-num' : ''}
                            >
                              {formatCell(row[col], col, t)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {totals && (
                        <TableRow className="reports-table-total-row">
                          {columns.map((col) => (
                            <TableCell
                              key={col}
                              align={isNumericColumn(col) ? 'right' : 'left'}
                              className={isNumericColumn(col) ? 'reports-table-num' : ''}
                            >
                              {formatCell(totals[col], col, t)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* {preview.footerNote && (
                  <Typography className="reports-footer-note" variant="caption" color="text.secondary">
                    {preview.footerNote}
                  </Typography>
                )} */}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
