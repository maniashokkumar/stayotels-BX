import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageRoomsTable from './ManageRoomsTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateTableState } from '../../Rooms/ManageRooms/manageRoomsTableSlice';

function ManageRooms() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userPermission = localStorage.getItem('roles');
  const breadCrumButtonClickHandler = (e, item) => {
    if (item.url === "/create-rooms") {
      navigate(item.url)
      dispatch(updateTableState({ flow: FLOW_TYPE.NEW }));
    }
  }
  return (
    <div className={"manage-rooms-page page"}>
      <Breadcrumb
        pageTitle={t("Manage Rooms")}
        buttonList={
           [
          {
            variant: "contained",
            text: t("Create Rooms"),
            url: "/create-rooms"
          }
        ] }
        breadcrumbList={
          [
            {
              title: t("Home"),
              url: "/",
            },
            {
              title: t("Rooms"),
              url: "/manage-rooms",
            }
          ]
        }
        breadCrumButtonClickHandler={breadCrumButtonClickHandler}
        hideBreadcrumb={true}
      />
      <ManageRoomsTable />
      
    </div>
  )
}

export default ManageRooms
