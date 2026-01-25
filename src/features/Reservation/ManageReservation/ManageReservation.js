import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageReservationTable from './ManageReservationTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateTableState } from '../../Reservation/ManageReservation/manageReservationTableSlice';

function ManageReservaton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userPermission = localStorage.getItem('roles');
  const breadCrumButtonClickHandler = (e, item) => {
    if (item.url === "/create-reservation") {
      navigate(item.url)
      dispatch(updateTableState({ flow: FLOW_TYPE.NEW }));
    }
  }
  return (
    <div className={"manage-reservation-page page"}>
      <Breadcrumb
        pageTitle={t("Manage Reservation")}
        buttonList={          
        userPermission !== null && userPermission.includes("RESERVATION:ADD")
          ? 
          [{
            variant: "contained",
            text: t("Create Reservation"),
            url: "/create-reservation"
          }
        ]  : []
    }
        breadcrumbList={
           [{
              title: t("Home"),
              url: "/",
            },
            {
              title: t("Reservation"),
              url: "/manage-reservation",
            }
          ]
        }
        breadCrumButtonClickHandler={breadCrumButtonClickHandler}
        hideBreadcrumb={true}
      />
      <ManageReservationTable />
    </div>
  )
}

export default ManageReservaton
