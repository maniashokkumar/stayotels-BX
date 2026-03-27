import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './ManageCouponTable.scss'

import { useTranslation } from 'react-i18next';
import Tooltip from '@mui/material/Tooltip';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import IconButton from '@mui/material/IconButton';
import { MUIDataTable, AlertDialog } from '../../../components/index';
import { FLOW_TYPE, CRUD_ACTION } from '../../../Utils/constants';

import { fetchCouponList, updateCouponTableState } from './manageCouponTableSlice';
import { deleteCoupon } from './ManageCouponApi';

function ManageCouponTable() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userPermission = localStorage.getItem('roles');

    const data = useSelector((state) => state.manageCouponTableReducer.data);
    const loading = useSelector((state) => state.manageCouponTableReducer.loading);
    const total = useSelector((state) => state.manageCouponTableReducer.total);
    const page = useSelector((state) => state.manageCouponTableReducer.page);
    const rowsPerPage = useSelector((state) => state.manageCouponTableReducer.rowsPerPage);
    const sortBy = useSelector((state) => state.manageCouponTableReducer.sortBy);
    const sortKey = useSelector((state) => state.manageCouponTableReducer.sortKey);
    const showSessionPopup = useSelector((state) => state.loginReducer.showSessionPopup);

    const [showDeletePopup, setShowDeletePopup] = useState({
        show: false,
        data: null
    });
    const [hasInitialized, setHasInitialized] = useState(false);

    const fetchTable = async () => {
        await dispatch(fetchCouponList({ data: {}, params: { perPage: rowsPerPage, page: page, sortBy, sortKey } }));
    }

    useEffect(() => {
        onPageLoad();
    }, [])

    useEffect(() => {
        if (hasInitialized) {
            fetchTable();
        }
    }, [page, sortBy, sortKey, rowsPerPage, hasInitialized, showSessionPopup])

    const handleTableButtonAction = async (e, action, tableMeta) => {
        const index = tableMeta.rowIndex;
        const selectedRow = data[index];
        if (index !== -1) {
            if (action === CRUD_ACTION.EDIT) {
                dispatch(updateCouponTableState({ selectedCouponData: selectedRow, flow: FLOW_TYPE.EDIT }));
                navigate('/create-coupon');
            } else if (action === CRUD_ACTION.DELETE) {
                setShowDeletePopup({
                    show: true,
                    data: selectedRow
                });
            }
        }
    }

    const columns = [
        {
            name: "code",
            label: t("Coupon Code"),
            options: { filter: true, sort: false }
        },
        {
            name: "discountType",
            label: t("Type"),
            options: { filter: true, sort: false }
        },
        {
            name: "discountValue",
            label: t("Value"),
            options: { filter: true, sort: false }
        },
        {
            name: "expiryDate",
            label: t("Expiry Date"),
            options: {
                filter: true,
                sort: false,
                inputType: 'date',
                customBodyRender: (value) => value ? new Date(value).toLocaleDateString('en-IN').split('/').join('-') : "-"
            }
        },
        {
            name: "usageLimit",
            label: t("Usage (Used/Limit)"),
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = data[tableMeta.rowIndex];
                    return `${row?.usedCount || 0} / ${value || 0}`;
                }
            }
        },
        {
            name: "isActive",
            label: t("Status"),
            options: {
                filter: true,
                sort: false,
                inputType: 'status',
                customBodyRender: (value) => value === true || value === "true" ? "Active" : "Inactive"
            }
        },
        {
            name: "action",
            label: t("Action"),
            options: {
                filter: false,
                sort: false,
                display: userPermission !== null && (userPermission.includes("COUPON:EDIT") || userPermission.includes("COUPON:DELETE")) ? true : false,
                customBodyRender: (value, tableMeta) => {
                    return (
                        <div className="action-buttons-wrapper">
                            {userPermission !== null && userPermission.includes("COUPON:EDIT") &&
                                <Tooltip title={t("Edit Coupon")}>
                                    <IconButton aria-label="edit" onClick={(e) => { handleTableButtonAction(e, CRUD_ACTION.EDIT, tableMeta) }}>
                                        <EditOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            }
                            {userPermission !== null && userPermission.includes("COUPON:DELETE") &&
                                <Tooltip title={t("Delete Coupon")}>
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
    ];

    async function onPageLoad() {
        dispatch(updateCouponTableState({ appliedFilterList: [], page: 0, sortBy: "", sortKey: "", rowsPerPage: 10, total: 0 }));
        setHasInitialized(true);
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
        sort: false,
        serverSide: true,
        count: total,
        page: page,
        rowsPerPage: rowsPerPage,
        rowsPerPageOptions: [5, 10, 50, 100],
        onTableChange: (action, tableState) => {
            const { page, rowsPerPage } = tableState;
            if (action === "changePage") {
                dispatch(updateCouponTableState({ page }));
            } else if (action === "changeRowsPerPage") {
                dispatch(updateCouponTableState({ rowsPerPage, page: 0 }));
            }
        }
    }

    const deleteCouponHandler = async () => {
        dispatch(updateCouponTableState({ loading: true }));
        const { couponId } = showDeletePopup.data;
        const response = await deleteCoupon({ couponId }, dispatch);
        if (response) {
            setShowDeletePopup({ show: false, data: null });
            fetchTable();
        }
    }

    return (
        <div className="manage-coupon-table">
            <AlertDialog
                title={t("Confirmation")}
                modalName="delete-coupon-modal"
                open={showDeletePopup.show}
                hideCloseButton={true}
                closeModalHandler={() => { setShowDeletePopup({ show: false, data: null }) }}
                submitModalHandler={deleteCouponHandler}
            >
                <span>{t("Are you sure you want to delete this coupon?")}</span>
            </AlertDialog>
            <MUIDataTable
                title={t("Coupons")}
                tableClassName={`manage-coupon-table compact`}
                columns={columns}
                data={data}
                options={options}
                loading={loading}
            />
        </div>
    )
}

export default ManageCouponTable
