import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Stack, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { MUIDataTable } from '../../../components/index';
import { fetchCancellationList, updateRefundDetails } from './manageCancellationTableSlice';
import { reservationGrandTotal } from '../reservationDisplayUtils';

function ManageCancellationTable() {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const data = useSelector((state) => state.manageCancellationTableReducer.data);
    const loading = useSelector((state) => state.manageCancellationTableReducer.loading);

    // Local state for editable fields
    const [editRecords, setEditRecords] = useState({});
    const [editingRowId, setEditingRowId] = useState(null);

    const refundStatusLabel = (code) => {
        const c = (code || 'PENDING').toUpperCase();
        if (c === 'PROCESSED' || c === 'COMPLETED') return t('Refund processed');
        if (c === 'NOT_APPLICABLE') return t('No Refund Needed');
        return t('Pending');
    };

    /** Single “refund done” value in DB/UI; COMPLETED is legacy only. */
    const normalizeRefundStatusForEdit = (code) => {
        const c = (code || 'PENDING').toUpperCase();
        if (c === 'COMPLETED') return 'PROCESSED';
        return code || 'PENDING';
    };

    const handleEditStart = (row) => {
        setEditingRowId(row.reservationId);
        setEditRecords(prev => ({
            ...prev,
            [row.reservationId]: {
                refundStatus: normalizeRefundStatusForEdit(row.refundStatus),
            },
        }));
    };

    const handleCancelEdit = () => {
        setEditingRowId(null);
    };

    const handleLocalChange = (id, field, value) => {
        setEditRecords(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const rowAtMeta = (tableMeta) => {
        const idx = tableMeta.dataIndex != null ? tableMeta.dataIndex : tableMeta.rowIndex;
        return data[idx];
    };

    const handleSave = async (id) => {
        const rec = editRecords[id];
        if (rec?.refundStatus == null) return;
        const action = await dispatch(updateRefundDetails({ id, refundStatus: rec.refundStatus }));
        if (updateRefundDetails.fulfilled.match(action) && action.payload != null) {
            setEditingRowId(null);
        }
    };

    const columns = [
        {
            name: "orderId",
            label: t("Order ID"),
            options: { filter: false, sort: true }
        },
        {
            name: "guestName",
            label: t("Guest Name"),
            options: { filter: false, sort: true }
        },
        {
            name: "guestEmail",
            label: t("Guest Email"),
            options: { filter: false, sort: true }
        },
        {
            name: "cancelledAtFormatted",
            label: t("Cancelled At"),
            options: { filter: false, sort: true }
        },
        {
            name: "totalCost",
            label: t("Amount paid"),
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const row = rowAtMeta(tableMeta);
                    const paid = row ? reservationGrandTotal(row) : Number(value) || 0;
                    return `₹${paid.toFixed(2)}`;
                },
            }
        },
        {
            name: "refundAmount",
            label: t("Refund Amount"),
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => `₹${value != null ? Number(value).toFixed(2) : '0.00'}`,
            }
        },
        {
            name: "refundStatus",
            label: t("Refund Status"),
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const row = rowAtMeta(tableMeta);
                    if (!row) return '';
                    const isEditing = editingRowId === row.reservationId;

                    if (isEditing) {
                        const editValue =
                            editRecords[row.reservationId]?.refundStatus
                            ?? normalizeRefundStatusForEdit(value);
                        return (
                            <FormControl
                                size="small"
                                sx={{ minWidth: 160 }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <InputLabel id={`refund-status-${row.reservationId}`}>{t('Refund status')}</InputLabel>
                                <Select
                                    labelId={`refund-status-${row.reservationId}`}
                                    label={t('Refund status')}
                                    value={editValue}
                                    onChange={(e) => handleLocalChange(row.reservationId, 'refundStatus', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    MenuProps={{ disableScrollLock: true, PaperProps: { style: { zIndex: 2000 } } }}
                                >
                                    <MenuItem value="PENDING">{t('Pending')}</MenuItem>
                                    <MenuItem value="PROCESSED">{t('Refund processed')}</MenuItem>
                                    <MenuItem value="NOT_APPLICABLE">{t('No Refund Needed')}</MenuItem>
                                </Select>
                            </FormControl>
                        );
                    }
                    return <Typography variant="body2" component="span">{refundStatusLabel(value)}</Typography>;
                }
            }
        },
        {
            name: "action",
            label: t("Action"),
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const row = rowAtMeta(tableMeta);
                    if (!row) return '';
                    const isEditing = editingRowId === row.reservationId;

                    if (isEditing) {
                        return (
                            <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                                <Tooltip title={t("Save")}>
                                    <IconButton
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave(row.reservationId);
                                        }}
                                    >
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t("Cancel")}>
                                    <IconButton
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelEdit();
                                        }}
                                    >
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        );
                    }

                    return (
                        <Tooltip title={t("Edit")}>
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStart(row);
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    );
                }
            }
        }
    ];

    const options = {
        responsive: "vertical",
        selectableRows: 'none',
        search: false,
        print: false,
        download: false,
        viewColumns: false,
        filter: false,
        pagination: true,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 25, 50],
    };

    return (
        <div className="manage-cancellation-table">
            <MUIDataTable
                title={t("Cancelled Bookings")}
                columns={columns}
                data={data}
                options={options}
                loading={loading}
            />
        </div>
    );
}

export default ManageCancellationTable;
