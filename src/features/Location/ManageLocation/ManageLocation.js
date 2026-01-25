import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageLocationTable from './ManageLocationTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateTableState } from '../../Location/ManageLocation/manageLocationTableSlice';

function ManageLocation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userPermission = localStorage.getItem('roles');

  const breadCrumButtonClickHandler = (e, item) => {
    if (item.url === "/create-location") {
      navigate(item.url)
      dispatch(updateTableState({ flow: FLOW_TYPE.NEW }));
    }
  }
  return (
    <div className={"manage-location-page page"}>
      <Breadcrumb
        pageTitle={t("Manage Location")}
        buttonList={userPermission !== null && userPermission.includes("LOCATION:ADD")
          ? [{
            variant: "contained",
            text: t("Create Location"),
            url: "/create-location"
          }]
          :
          []
      }
        breadcrumbList={
          [
            {
              title: t("Home"),
              url: "/",
            },
            {
              title: t("Location"),
              url: "/manage-location",
            }
          ]
        }
        breadCrumButtonClickHandler={breadCrumButtonClickHandler}
        hideBreadcrumb={true}
      />
      <ManageLocationTable />
    </div>
  )
}

export default ManageLocation
