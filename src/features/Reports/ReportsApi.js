import { axiosPrService } from '../../axios/axiosInstance';

function saveBlobResponse(res, fallbackName) {
  const disposition = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
  let filename = fallbackName;
  if (disposition) {
    const match = /filename="([^"]+)"/i.exec(disposition);
    if (match?.[1]) {
      filename = match[1];
    }
  }
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function buildReportPayload({
  reportType,
  hotelId,
  dateFrom,
  dateTo,
  dateBasis,
  includeCancelled,
  salesChannel,
  paymentStatus,
}) {
  const payload = {
    reportType,
    hotelId: hotelId || 'all',
    dateFrom,
    dateTo,
    dateBasis: dateBasis || 'CHECK_IN',
    includeCancelled: Boolean(includeCancelled),
  };
  if (salesChannel && salesChannel !== 'all') {
    payload.salesChannel = salesChannel;
  }
  if (paymentStatus && paymentStatus !== 'all') {
    payload.paymentStatus = paymentStatus;
  }
  return payload;
}

export function parseReportApiError(error, fallback) {
  const data = error?.response?.data;
  if (data && typeof data === 'object' && data.message) {
    return data.message;
  }
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  return error?.message || fallback;
}

async function assertBlobResponse(res, expectedTypes) {
  const contentType = res.headers?.['content-type'] || res.headers?.['Content-Type'] || '';
  if (contentType.includes('application/json') || contentType.includes('text/plain')) {
    const text = await res.data.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || text;
    } catch {
      // keep raw text
    }
    throw new Error(message || 'Report export failed.');
  }
  const ok = expectedTypes.some((t) => contentType.includes(t));
  if (!ok && res.status >= 400) {
    throw new Error('Report export failed.');
  }
}

export async function previewReport(payload) {
  const res = await axiosPrService.post('/reservation/reports/preview', payload);
  return res.data;
}

export async function downloadReportExcel(payload) {
  const res = await axiosPrService.post('/reservation/reports/export/excel', payload, {
    responseType: 'blob',
  });
  await assertBlobResponse(res, [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
  ]);
  saveBlobResponse(res, 'Stayotels_report.xlsx');
}

export async function openReportPdfInNewTab(payload) {
  const res = await axiosPrService.post('/reservation/reports/export/pdf', payload, {
    responseType: 'blob',
  });
  await assertBlobResponse(res, ['application/pdf', 'application/octet-stream']);
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const tab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!tab) {
    window.URL.revokeObjectURL(url);
    const err = new Error('POPUP_BLOCKED');
    err.code = 'POPUP_BLOCKED';
    throw err;
  }
  setTimeout(() => window.URL.revokeObjectURL(url), 120000);
}
