import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageCancellationTable from './ManageCancellationTable';
import { Breadcrumb } from '../../../components/index';
import { Box, Stack, TextField, Button } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { fetchCancellationList, updateCancellationTableState } from './manageCancellationTableSlice';

function ManageCancellation() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);

    React.useEffect(() => {
        dispatch(fetchCancellationList({ data: {}, params: {} }));
    }, [dispatch]);

    const handleSearch = () => {
        const filterData = {};
        if (dateFrom && dateTo) {
            filterData.dateFrom = dateFrom.format('YYYY-MM-DD');
            filterData.dateTo = dateTo.format('YYYY-MM-DD');
        }
        dispatch(fetchCancellationList({ data: filterData, params: {} }));
    };

    return (
        <div className={"manage-cancellation-page page"}>
            <Breadcrumb
                pageTitle={t("Cancellation Management")}
                buttonList={[]}
                breadcrumbList={[
                    { title: t("Home"), url: "/" },
                    { title: t("Cancellations"), url: "/manage-cancellation" }
                ]}
                hideBreadcrumb={true}
            />

            <Box className="card-wrapper-default" sx={{ mb: 3, p: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <DatePicker
                            label={t("Cancelled From")}
                            value={dateFrom}
                            onChange={(newValue) => setDateFrom(newValue)}
                            renderInput={(params) => <TextField {...params} size="small" />}
                        />
                        <DatePicker
                            label={t("Cancelled To")}
                            value={dateTo}
                            onChange={(newValue) => setDateTo(newValue)}
                            renderInput={(params) => <TextField {...params} size="small" />}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            sx={{ height: 40 }}
                        >
                            {t("Search")}
                        </Button>
                    </Stack>
                </LocalizationProvider>
            </Box>

            <ManageCancellationTable />
        </div>
    );
}

export default ManageCancellation;
