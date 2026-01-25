import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageHotelTable from './ManageHotelTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateTableState } from '../../Hotel/ManageHotel/manageHotelTableSlice';

function ManageHotel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userPermission = localStorage.getItem('roles');

  const breadCrumButtonClickHandler = (e, item) => {
    if (item.url === "/create-hotel") {
      navigate(item.url)
      dispatch(updateTableState({ flow: FLOW_TYPE.NEW }));
    }
  }
  return (
    <div className={"manage-hotel-page page"}>
      <Breadcrumb
        pageTitle={t("Manage Hotel")}
        buttonList={
        userPermission !== null && userPermission.includes("HOTEL:ADD")
        ? [
            {
            variant: "contained",
            text: t("Create Hotel"),
            url: "/create-hotel"
          },
        ]
      : []
  }
        breadcrumbList={
          [
            {
              title: t("Home"),
              url: "/",
            },
            {
              title: t("Hotel"),
              url: "/manage-hotel",
            }
          ]
        }
        breadCrumButtonClickHandler={breadCrumButtonClickHandler}
        hideBreadcrumb={true}
      />
      <ManageHotelTable />
      
    </div>
  )
}

export default ManageHotel
