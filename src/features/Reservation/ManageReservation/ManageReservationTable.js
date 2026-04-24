import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './ManageReservationTable.scss'

import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { renderColumns, formatFilters } from '../../../components/MUIDataTable/MUIHelper';
import { AlertDialog } from '../../../components/index';
import { CustomSelectField } from '../../../components/ReactHookForm';
import { listHotel } from '../../CalendarView/CalendarViewApi';
import { FLOW_TYPE, CRUD_ACTION } from '../../../Utils/constants';

import { store } from '../../../redux/store';
import { fetchReservationList, updateTableState, fetchReservationListTableColumnConfig } from './manageReservationTableSlice';
import { fetchLookupOptionsSearch, deleteReservation, cancelReservationFromControlPanel } from './ManageReservationApi';
import ReservationDetailDrawer from './ReservationDetailDrawer';
import { guestName, guestPhone, formatMoney, statusLabel, cpSourceLabel } from '../reservationDisplayUtils';

function dateShort(ymd) {
  if (!ymd) return '—';
  const d = dayjs(ymd);
  return d.isValid() ? d.format('D MMM YYYY') : ymd;
}

function checkInDayEndExclusive(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

function ManageReservationTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { control } = useForm({ defaultValues: { manageReservationHotelId: '' } });

  const columnsOriginalResponse = useSelector((state) => state.manageReservationTableReducer.columnsOriginalResponse);
  const data = useSelector((state) => state.manageReservationTableReducer.data);
  const loading = useSelector((state) => state.manageReservationTableReducer.loading);
  const total = useSelector((state) => state.manageReservationTableReducer.total);
  const page = useSelector((state) => state.manageReservationTableReducer.page);
  const rowsPerPage = useSelector((state) => state.manageReservationTableReducer.rowsPerPage);
  const sortBy = useSelector((state) => state.manageReservationTableReducer.sortBy);
  const sortKey = useSelector((state) => state.manageReservationTableReducer.sortKey);
  const appliedFilterList = useSelector((state) => state.manageReservationTableReducer.appliedFilterList);
  const showSessionPopup = useSelector((state) => state.loginReducer.showSessionPopup);
  const userPermission = localStorage.getItem('roles');
  const [columns, setColumns] = useState([]);
  const [columnNameToBeFetched, setColumnNameToBeFetched] = useState(null);
  const [showCancelReservationPopup, setShowCancelReservationPopup] = useState({
    show: false,
    data: null,
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [checkInFilter, setCheckInFilter] = useState(null);
  const [optionsHotel, setOptionsHotel] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState('');
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

  const getOptionsDelayed = useCallback(
    _.debounce((text, columnName, lookupKey, callback) => {
      if (text) {
        // getOptionsAsync(text).then(callback);
        fetchLookupOptionsSearch(columnName, [lookupKey], { ['search' + lookupKey]: text }, dispatch).then(callback);
      }
    }, 300), [],
  );

  const fetchTable = async () => {
    if (!selectedHotel) {
      dispatch(updateTableState({ data: [], total: 0 }));
      return;
    }
    let filterData = { hotelId: selectedHotel };
    if (columnsOriginalResponse.length > 0) {
      const fromColumns = await formatFilters(columnsOriginalResponse, appliedFilterList);
      filterData = { ...fromColumns, hotelId: selectedHotel };
    }
    if (checkInFilter && dayjs.isDayjs(checkInFilter) && checkInFilter.isValid()) {
      const from = checkInFilter.format('YYYY-MM-DD');
      const lt = checkInDayEndExclusive(from);
      if (lt) {
        filterData.checkIndatefrom = from;
        filterData.checkIndatelt = lt;
      }
    }
    await dispatch(fetchReservationList({ data: filterData, params: { perPage: rowsPerPage, page: page, sortBy, sortKey } }));
    clearFilterValues();
  }

  useEffect(() => {
    // didMount
    onPageLoad();
    return () => {
      // console.log('unmount')
    }
  }, [])

  useEffect(() => {
    if (hasInitialized) {
      fetchTable();
    }
  }, [page, sortBy, sortKey, rowsPerPage, appliedFilterList, hasInitialized, showSessionPopup, checkInFilter, selectedHotel])


  useEffect(() => {
    if (columnNameToBeFetched) {
      let tempcolumnNameToBeFetched = columnNameToBeFetched;
      let lookupKey = '';
      // setColumnNameToBeFetched(null)
      const updateColumnIndex = columns.findIndex(el => el.name === tempcolumnNameToBeFetched);
      let inputValue = ''
      if (updateColumnIndex) {
        inputValue = columns[updateColumnIndex].options.customConfig.inputValue;
        const columnWithLookup = columnsOriginalResponse.find(el => el.fieldName === tempcolumnNameToBeFetched);
        if (columnWithLookup) {
          lookupKey = columnWithLookup.lookUp.lookupDisplay
        }
      }
      //Note:: Async option, set loader to true 
      setColumns(state => {
        let updatedState = _.cloneDeep(state);
        updatedState[updateColumnIndex].options.customConfig.loading = true
        return updatedState
      })

      //Note:: Async option, update options list and set loader to false
      getOptionsDelayed(inputValue, tempcolumnNameToBeFetched, lookupKey, (filteredOptions) => {
        setColumns(state => {
          let updatedState = _.cloneDeep(state);
          updatedState[updateColumnIndex].options.customConfig.optionList = filteredOptions
          updatedState[updateColumnIndex].options.customConfig.loading = false
          return updatedState
        })
        setColumnNameToBeFetched(null)
      });
    }
  }, [columnNameToBeFetched])

  const handleTableButtonAction = async (e, action, tableMeta) => {
    const index = tableMeta.rowIndex;
    const selectedRow = tableMeta.tableData[index];
    if (index !== -1) {
      if (action === CRUD_ACTION.EDIT) {
        dispatch(updateTableState({ selectedReservationData: selectedRow, flow: FLOW_TYPE.EDIT }));
        navigate('/create-reservation');
      } else if (action === CRUD_ACTION.COMPLETE_BOOKING) {
        dispatch(updateTableState({ flow: FLOW_TYPE.NEW, selectedReservationData: null }));
        navigate('/create-reservation', { state: { completeBooking: selectedRow } });
      } else if (action === CRUD_ACTION.DELETE) {
        const { reservationId } = selectedRow;
        setShowCancelReservationPopup((state) => {
          return {
            ...state,
            show: true,
            data: { reservationId },
          };
        });
      }
    }
  }

  useEffect(() => {
    if (columnsOriginalResponse && columnsOriginalResponse.length > 0) {
      let updatedColumnsOriginalResponse = columnsOriginalResponse.map((el, index) => {
        return {
          ...el,
          filterList: appliedFilterList[index] ? appliedFilterList[index] : []
        }

      })
      const columns = updatedColumnsOriginalResponse.map((item, index) => {
        if (item.displayName === "Action") {
          if (item.fieldName === "checkinDate") {
            return {
              name: item.fieldName,
              label: t(item.displayName),
              options: {
                filter: item.isFilterField,
                sort: item.isSortField,
                customBodyRender: (value) => {
                  if (!value) return "-"; // Handle null/undefined case
                  return new Date(value).toLocaleDateString(); // Convert to readable date format
                }
              }
            };
          }
          return {
            name: "action",
            label: t("Action"),
            options: {
              filter: false,
              sort: false,
              display: userPermission !== null && (userPermission.includes("RESERVATION:DELETE") || userPermission.includes("RESERVATION:EDIT")) ? true : false,
              customBodyRender: (value, tableMeta, updateValue) => {
                //  const rowIndex = tableMeta.rowIndex
                const row = tableMeta.tableData[tableMeta.rowIndex];
                const blocked = (row?.status || '').toUpperCase() === 'HOTEL_BLOCKED';
                const canComplete = userPermission !== null && userPermission.includes('RESERVATION:EDIT');
                return (
                  <div className="action-buttons-wrapper">
                     {blocked && canComplete &&
                    <Tooltip title={t('Complete booking')}>
                      <IconButton aria-label="complete-booking" onClick={(e) => { handleTableButtonAction(e, CRUD_ACTION.COMPLETE_BOOKING, tableMeta) }}>
                        <CheckCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                    }
                     {userPermission !== null && userPermission.includes("RESERVATION:DELETE") &&
                    <Tooltip title={"Delete Reservation"}>
                      <IconButton aria-label="delete" onClick={(e) => { handleTableButtonAction(e, CRUD_ACTION.DELETE, tableMeta) }}>
                        <HighlightOffOutlinedIcon />
                      </IconButton>
                    </Tooltip>
              }
                  </div>
                )
              }
            }

          }
        }
        else {
          return renderColumns(item, setColumnNameToBeFetched, setColumns)
        }
      });
      setColumns(columns);
    }
  }, [columnsOriginalResponse])


  async function onPageLoad() {
    dispatch(updateTableState({ appliedFilterList: [], page: 0, sortBy: "", sortKey: "", rowsPerPage: 10, total: 0 }));
    // if (columnsOriginalResponse.length === 0) {
    await dispatch(fetchReservationListTableColumnConfig({ params: {} }));
    // }
    setHasInitialized(true);
  }

  const handleFilterSubmit = applyFilters => {
    let filterList = applyFilters();
    // Update filters in columnsConfig and reset page to 0
    dispatch(updateTableState({ appliedFilterList: filterList, page: 0 }));
    // Update filters in redux 
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state)
      updatedColumns = updatedColumns.map((el, i) => {
        if (filterList[i] && filterList[i].length > 0) {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: filterList[i]
            }
          }
        } else {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: []
            }
          }
        }
      })
      return updatedColumns
    });
  };

  const handleReset = (applyFilters) => {
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state)
      updatedColumns = updatedColumns.map((el, i) => {
        return {
          ...el,
          options: {
            ...el.options,
            filterList: []
          }
        }
      })
      return updatedColumns
    });

    // Update the filter in redux state
    let updatedAppliedFilterList = appliedFilterList.map((el) => {
      return []
    });
    // and reset page to 0
    dispatch(updateTableState({ appliedFilterList: updatedAppliedFilterList, page: 0 }));
    // closes 
    applyFilters();
  }

  const options = {
    responsive: "vertical",
    selectableRows: 'none',
    search: false,
    print: false,
    download: false,
    viewColumns: false,
    fixedHeader: true,
    filter: false,
    fixedSelectColumn: true,
    tableBodyHeight: '400px',
    serverSide: true,
    count: total,
    page: page,
    rowsPerPage: rowsPerPage,
    rowsPerPageOptions: [5, 10, 50, 100],
    confirmFilters: true,
    customFilterDialogFooter: (currentFilterList, applyNewFilters) => {
      return (
        <div className="custom-filter-dialog-footer-wrapper" style={{ marginTop: '40px' }}>
          <Button variant="contained" onClick={() => handleFilterSubmit(applyNewFilters)}>Apply Filters</Button>
          <Button variant="text" onClick={() => handleReset(applyNewFilters)}>Reset</Button>
        </div>
      );
    },
    onColumnSortChange: async (changedColumn, direction) => {
      await dispatch(updateTableState({ sortBy: changedColumn, sortKey: direction, page: 0 }));
    },
    onTableChange: (action, tableState) => {
      const { page, rowsPerPage } = tableState;
      if (action === "changePage") {
        dispatch(updateTableState({ page }));
      } else if (action === "changeRowsPerPage") {
        dispatch(updateTableState({ rowsPerPage, page: 0 }));
      }
    },
    onFilterChange: (column, filterList, type, changedColumnIndex, displayData) => {
      if (type === 'chip') {
        dispatch(setColumnNameToBeFetched(null))
      } else if (type === 'reset') {

      }
    },
  }

  const clearFilterValues = () => {
    // Update the filter from columns state
    setColumns(state => {
      let updatedColumns = _.cloneDeep(state);
      updatedColumns = updatedColumns.map((el, i) => {
        return {
          ...el,
          options: {
            ...el.options,
            filterList: []
          }
        }
      })
      return updatedColumns;
    })
  }


  const closeModalHandler = (modalName) => {
    if (modalName === 'showCancelReservationPopup') {
      setShowCancelReservationPopup((state) => ({
        ...state,
        show: false,
      }));
    }
  };

  const cancelReservationHandler = async () => {
    const { reservationId } = showCancelReservationPopup.data || {};
    if (!reservationId) return;
    const ok = await cancelReservationFromControlPanel({ reservationId }, dispatch);
    if (ok) {
      setShowCancelReservationPopup({
        show: false,
        data: null,
      });
      await fetchTable();
    }
  };

  const openDetails = (row) => {
    setSelectedReservation(row);
    setDetailOpen(true);
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelectedReservation(null);
  };

  const handleHotelChange = (e) => {
    setSelectedHotel(e.target.value);
    dispatch(updateTableState({ page: 0 }));
    closeDetails();
  };

  const handleCompleteBooking = (row) => {
    dispatch(updateTableState({ flow: FLOW_TYPE.NEW, selectedReservationData: null }));
    navigate('/create-reservation', { state: { completeBooking: row } });
  };

  const handleCancelBookingClick = (row) => {
    const { reservationId } = row || {};
    if (!reservationId) return;
    setShowCancelReservationPopup({
      show: true,
      data: { reservationId },
    });
  };

  const clearFilters = () => {
    setCheckInFilter(null);
    dispatch(updateTableState({ page: 0 }));
    closeDetails();
  };


  return (
    <div className="manage-reservation-table">
      <AlertDialog
        title={t('Confirmation')}
        modalName="cancel-reservation-modal"
        open={showCancelReservationPopup.show}
        hideCloseButton={true}
        closeModalHandler={() => {
          closeModalHandler('showCancelReservationPopup');
        }}
        submitModalHandler={cancelReservationHandler}
      >
        <span>{t('Cancel this booking? It will stay in the list as cancelled for refunds and history.')}</span>
      </AlertDialog>

      <Box className="manage-reservation-card-wrapper">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ maxWidth: { xs: '100%', sm: 480 } }}>
              <CustomSelectField
                id="manageReservationHotelId"
                label={t('Hotel')}
                control={control}
                variant="outlined"
                size="small"
                options={optionsHotel}
                values={selectedHotel}
                handleCustomInputChange={handleHotelChange}
              />
            </Box>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
            <Box sx={{ flex: '1 1 220px', minWidth: 200, maxWidth: { sm: 400 } }}>
              <DatePicker
                label={t('Check-in date filter')}
                value={checkInFilter}
                onChange={(v) => {
                  setCheckInFilter(v);
                  dispatch(updateTableState({ page: 0 }));
                  closeDetails();
                }}
                renderInput={(params) => (
                  <TextField {...params} size="small" fullWidth variant="outlined" />
                )}
              />
            </Box>
            <Button
              variant="outlined"
              size="medium"
              onClick={clearFilters}
              sx={{ flexShrink: 0, height: 40, textTransform: 'none' }}
            >
              {t('Clear filters')}
            </Button>
            </Stack>
          </Stack>
        </LocalizationProvider>

        {loading && (
          <Box className="manage-reservation-card-grid manage-reservation-card-grid--skeleton" aria-hidden="true">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} variant="rounded" height={176} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        )}

        {!loading && !selectedHotel && (
          <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
            {t('Select a hotel to load reservations')}
          </Typography>
        )}

        {!loading && selectedHotel && data && data.length === 0 && (
          <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
            {t('No reservations found')}
          </Typography>
        )}

        {!loading && data && data.length > 0 && (
          <Box className="manage-reservation-card-grid">
            {data.map((row) => {
              const oid = row.orderId || row.reservationId || '—';
              const st = (row?.status || '').toUpperCase();
              const blocked = st === 'HOTEL_BLOCKED';
              const canComplete = userPermission !== null && userPermission.includes('RESERVATION:EDIT');
              const mayEditOrDelete =
                userPermission !== null &&
                (userPermission.includes('RESERVATION:EDIT') || userPermission.includes('RESERVATION:DELETE'));
              const canCancelFromPanel =
                mayEditOrDelete && st !== 'CANCELLED' && (st === 'HOTEL_BLOCKED' || st === 'CONFIRMED');

              return (
                <Box key={row.reservationId || row.orderId} sx={{ display: 'flex', minWidth: 0, width: '100%' }}>
                  <Card elevation={0} className="manage-reservation-card-item" sx={{ width: '100%' }}>
                    <CardActionArea
                      onClick={() => openDetails(row)}
                      aria-label={`${t('Reservation')} ${oid}, ${guestName(row)}`}
                      sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                      className="manage-reservation-card-item__action"
                    >
                      <Box className="manage-reservation-card-item__top">
                        <Typography className="manage-reservation-card-item__id" variant="body2" fontWeight={700}>
                          #{oid}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={statusLabel(row, t)}
                          className="manage-reservation-card-item__chip"
                          sx={{
                            color: '#fff',
                            borderColor: 'rgba(255,255,255,0.65)',
                            '& .MuiChip-label': { color: '#fff', fontWeight: 600, fontSize: '0.7rem' },
                          }}
                        />
                      </Box>

                      <Box className="manage-reservation-card-item__name-row">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            className="manage-reservation-card-item__name"
                            variant="subtitle1"
                            fontWeight={600}
                            noWrap
                            title={guestName(row)}
                          >
                            {guestName(row)}
                          </Typography>
                          <Typography
                            className="manage-reservation-card-item__hotel-room"
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            title={`${row?.hotels || ''} ${row?.rooms || ''}`.trim()}
                          >
                            {(row?.hotels && row?.rooms) ? `${row.hotels} · ${row.rooms}` : (row?.hotels || row?.rooms || '—')}
                          </Typography>
                          {cpSourceLabel(row, t) ? (
                            <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mt: 0.25 }}>
                              {cpSourceLabel(row, t)}
                            </Typography>
                          ) : null}
                        </Box>
                        <Typography
                          className="manage-reservation-card-item__phone"
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          title={guestPhone(row)}
                        >
                          {guestPhone(row)}
                        </Typography>
                      </Box>

                      <Box className="manage-reservation-card-item__dates">
                        <Box className="manage-reservation-card-item__date-block">
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {t('Check-in')}
                          </Typography>
                          <Typography variant="caption" className="manage-reservation-card-item__date-value">
                            {dateShort(row.checkIn)}
                          </Typography>
                        </Box>
                        <Box className="manage-reservation-card-item__date-block manage-reservation-card-item__date-block--end">
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {t('Checkout')}
                          </Typography>
                          <Typography variant="caption" className="manage-reservation-card-item__date-value">
                            {dateShort(row.checkOut)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box className="manage-reservation-card-item__bottom">
                        <Typography variant="body2" fontWeight={600} className="manage-reservation-card-item__amount">
                          {formatMoney(row.totalCost)}
                        </Typography>
                      </Box>
                    </CardActionArea>

                    {(blocked && canComplete) || canCancelFromPanel ? (
                      <Stack className="manage-reservation-card-item__actions" direction="row" spacing={1} sx={{ px: 1.5, pb: 1.5 }}>
                        {blocked && canComplete && (
                          <Tooltip title={t('Move to booking completion flow')}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              className="manage-reservation-card-item__action-btn manage-reservation-card-item__action-btn--complete"
                              onClick={() => handleCompleteBooking(row)}
                              aria-label="complete-booking"
                            >
                              {t('Complete booking')}
                            </Button>
                          </Tooltip>
                        )}
                        {canCancelFromPanel && (
                          <Tooltip title={t('Cancel booking')}>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              className="manage-reservation-card-item__action-btn manage-reservation-card-item__action-btn--delete"
                              onClick={() => handleCancelBookingClick(row)}
                              aria-label="cancel-booking"
                            >
                              {t('Cancel')}
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    ) : null}
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}

        <Box className="manage-reservation-pagination-wrap">
          <TablePagination
            className="manage-reservation-pagination"
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => {
              dispatch(updateTableState({ page: p }));
              closeDetails();
            }}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              dispatch(updateTableState({ rowsPerPage: parseInt(e.target.value, 10), page: 0 }));
              closeDetails();
            }}
            rowsPerPageOptions={[5, 10, 50, 100]}
            labelRowsPerPage={t('')}
            SelectProps={{
              size: 'small',
              variant: 'outlined',
              MenuProps: { disableScrollLock: true },
            }}
          />
        </Box>
      </Box>

      <ReservationDetailDrawer
        open={detailOpen}
        onClose={closeDetails}
        reservation={selectedReservation}
        onSaved={async () => {
          const id = selectedReservation?.reservationId;
          await fetchTable();
          if (id) {
            const rows = store.getState().manageReservationTableReducer.data;
            const found = Array.isArray(rows) ? rows.find((r) => r?.reservationId === id) : null;
            if (found) setSelectedReservation(found);
          }
        }}
      />
    </div>
  )
}

export default ManageReservationTable
