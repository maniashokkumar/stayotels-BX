import { axiosPrService } from '../../axios/axiosInstance';
import { showSnackbar } from '../../redux/reducer/appSlice';

/** Next calendar day as yyyy-MM-dd (UTC) for exclusive check-in upper bound. */
export function checkInDayEndExclusive(ymd) {
  if (!ymd || typeof ymd !== 'string') return null;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Hotel-scoped reservation search (same endpoint as Manage Reservation; does not touch Redux table state).
 * @param {object} opts
 * @param {string} [opts.checkInDate] yyyy-MM-dd — filter bookings whose check-in falls on this day
 * @param {string} [opts.statusFilter] ALL | CONFIRMED | CANCELLED | COMPLETED | PENDING
 * @param {string} [opts.channelFilter] ALL | CONTROL_PANEL | WEBSITE — reservation.salesChannel
 */
export async function fetchBookingHistoryPage({
  hotelId,
  page,
  perPage,
  sortBy = '',
  sortKey = '',
  dispatch,
  checkInDate = '',
  statusFilter = 'ALL',
  channelFilter = 'ALL',
}) {
  const data = { statuscdnne: 'HOTEL_BLOCKED' };
  if (hotelId) {
    data.hotelId = hotelId;
  }
  if (channelFilter === 'CONTROL_PANEL') {
    data.salesChannelexacis = 'CONTROL_PANEL';
  } else if (channelFilter === 'WEBSITE') {
    data.salesChannelexacis = 'WEBSITE';
  }
  if (checkInDate) {
    const endEx = checkInDayEndExclusive(checkInDate);
    if (endEx) {
      data.checkIndatefrom = checkInDate;
      data.checkIndatelt = endEx;
    }
  }
  if (statusFilter && statusFilter !== 'ALL') {
    if (statusFilter === 'PENDING') {
      data.statuscdnnin = ['CANCELLED', 'COMPLETED', 'CONFIRMED'];
      data.isPaidcdnne = true;
    } else {
      data.statusexacis = statusFilter;
    }
  }
  const params = { perPage, page: page + 1, sortBy, sortKey };
  let result = { total: 0, data: [] };

  try {
    const res = await axiosPrService.post('/reservation/search/reservation', data, { params });
    if (res.status === 200 && Array.isArray(res.data)) {
      res.data.forEach((item) => {
        if (item.checkIn) {
          const d = new Date(item.checkIn);
          item.checkIn = d.toISOString().split('T')[0];
        }
        if (item.checkOut) {
          const d = new Date(item.checkOut);
          item.checkOut = d.toISOString().split('T')[0];
        }
      });
      result = {
        total: Number(res.headers['x-total-records']) || 0,
        data: res.data,
      };
    } else if (dispatch) {
      dispatch(showSnackbar({ type: 'error', message: res.data ? res.data : 'Service unavailable' }));
    }
  } catch (e) {
    if (e.status !== 401 && dispatch) {
      dispatch(showSnackbar({ type: 'error', message: e.message || 'Request failed' }));
    }
  }
  return result;
}
