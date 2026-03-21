import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { TextField, MenuItem, Select, FormControl, IconButton, Tooltip, Stack } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { MUIDataTable } from '../../../components/index';
import { fetchCancellationList, updateRefundDetails } from './manageCancellationTableSlice';

function ManageCancellationTable() {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const data = useSelector((state) => state.manageCancellationTableReducer.data);
    const loading = useSelector((state) => state.manageCancellationTableReducer.loading);

    // Local state for editable fields
    const [editRecords, setEditRecords] = useState({});
    const [editingRowId, setEditingRowId] = useState(null);

    const handleEditStart = (row) => {
        setEditingRowId(row.reservationId);
        setEditRecords(prev => ({
            ...prev,
            [row.reservationId]: {
                refundAmount: row.refundAmount,
                refundStatus: row.refundStatus || "PENDING"
            }
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

    const handleSave = (id) => {
        const updatedData = editRecords[id];
        if (updatedData) {
            dispatch(updateRefundDetails({ id, data: updatedData }));
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
            label: t("Original Amount"),
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => `₹${value?.toFixed(2)}`
            }
        },
        {
            name: "refundAmount",
            label: t("Refund Amount"),
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const row = data[tableMeta.rowIndex];
                    const isEditing = editingRowId === row.reservationId;

                    if (isEditing) {
                        const editValue = editRecords[row.reservationId]?.refundAmount ?? value;
                        return (
                            <TextField
                                size="small"
                                type="number"
                                value={editValue}
                                onChange={(e) => handleLocalChange(row.reservationId, 'refundAmount', e.target.value)}
                                sx={{ width: 100 }}
                            />
                        );
                    }
                    return `₹${value?.toFixed(2)}`;
                }
            }
        },
        {
            name: "refundStatus",
            label: t("Refund Status"),
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const row = data[tableMeta.rowIndex];
                    const isEditing = editingRowId === row.reservationId;

                    if (isEditing) {
                        const editValue = editRecords[row.reservationId]?.refundStatus ?? value ?? "PENDING";
                        return (
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select
                                    value={editValue}
                                    onChange={(e) => handleLocalChange(row.reservationId, 'refundStatus', e.target.value)}
                                >
                                    <MenuItem value="PENDING">{t("Pending")}</MenuItem>
                                    <MenuItem value="COMPLETED">{t("Done")}</MenuItem>
                                    <MenuItem value="NOT_APPLICABLE">{t("No Refund Needed")}</MenuItem>
                                </Select>
                            </FormControl>
                        );
                    }
                    return value || "PENDING";
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
                    const row = data[tableMeta.rowIndex];
                    const isEditing = editingRowId === row.reservationId;

                    if (isEditing) {
                        return (
                            <Stack direction="row" spacing={1}>
                                <Tooltip title={t("Save")}>
                                    <IconButton color="primary" onClick={() => handleSave(row.reservationId)}>
                                        <SaveIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t("Cancel")}>
                                    <IconButton color="error" onClick={handleCancelEdit}>
                                        <CancelIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        );
                    }

                    return (
                        <Tooltip title={t("Edit")}>
                            <IconButton onClick={() => handleEditStart(row)}>
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
