import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageCouponTable from './ManageCouponTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateCouponTableState } from './manageCouponTableSlice';

function ManageCoupon() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const userPermission = localStorage.getItem('roles');

    const breadCrumButtonClickHandler = (e, item) => {
        if (item.url === "/create-coupon") {
            navigate(item.url)
            dispatch(updateCouponTableState({ flow: FLOW_TYPE.NEW }));
        }
    }

    return (
        <div className={"manage-coupon-page page"}>
            <Breadcrumb
                pageTitle={t("Manage Coupons")}
                buttonList={
                    userPermission !== null && userPermission.includes("COUPON:ADD")
                    ? [{
                        variant: "contained",
                        text: t("Create Coupon"),
                        url: "/create-coupon"
                    }]
                    : []
                }
                breadcrumbList={
                    [{
                        title: t("Home"),
                        url: "/",
                    },
                    {
                        title: t("Coupons"),
                        url: "/manage-coupon",
                    }
                    ]
                }
                breadCrumButtonClickHandler={breadCrumButtonClickHandler}
                hideBreadcrumb={true}
            />
            <ManageCouponTable />
        </div>
    )
}

export default ManageCoupon
