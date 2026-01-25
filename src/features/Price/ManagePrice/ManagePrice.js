import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManagePriceTable from './ManagePriceTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateTableState } from '../../Price/ManagePrice/managePriceTableSlice';

function ManagePrice() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userPermission = localStorage.getItem('roles');

  const breadCrumButtonClickHandler = (e, item) => {
    if (item.url === "/create-price") {
      navigate(item.url)
      dispatch(updateTableState({ flow: FLOW_TYPE.NEW }));
    }
  }
  return (
    <div className={"manage-price-page page"}>
   <Breadcrumb
  pageTitle={t("Manage Price")}
  buttonList={
    userPermission !== null && userPermission.includes("PRICE:ADD")
      ? [
          {
            variant: "contained",
            text: t("Create Price"),
            url: "/create-price",
          },
        ]
      : []
  }
  breadcrumbList={[
    {
      title: t("Home"),
      url: "/",
    },
    {
      title: t("Price"),
      url: "/manage-price",
    },
  ]}
  breadCrumButtonClickHandler={breadCrumButtonClickHandler}
  hideBreadcrumb
/>

      <ManagePriceTable />
    </div>
  )
}

export default ManagePrice
