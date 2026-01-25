import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageAmenitiesTable from './ManageAmenitiesTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateTableState } from '../../Amenities/ManageAmenities/manageAmenitiesTableSlice';

function ManageAmenities() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userPermission = localStorage.getItem('roles');

  const breadCrumButtonClickHandler = (e, item) => {
    if (item.url === "/create-amenities") {
      navigate(item.url)
      dispatch(updateTableState({ flow: FLOW_TYPE.NEW }));
    }
  }
  return (
    <div className={"manage-amenities-page page"}>
      <Breadcrumb
        pageTitle={t("Manage Amenities")}
        buttonList={userPermission !== null && userPermission.includes("AMENITIES:ADD")
          ? [{
            variant: "contained",
            text: t("Create Amenities"),
            url: "/create-amenities"
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
              title: t("Amenities"),
              url: "/manage-amenities",
            }
          ]
        }
        breadCrumButtonClickHandler={breadCrumButtonClickHandler}
        hideBreadcrumb={true}
      />
      <ManageAmenitiesTable />
    </div>
  )
}

export default ManageAmenities
