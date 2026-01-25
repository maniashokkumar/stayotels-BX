import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ManageUserTable from './ManageUserTable';
import { FLOW_TYPE } from '../../../Utils/constants';
import { Breadcrumb } from '../../../components/index';
import { updateTableState } from '../../User/ManageUser/manageUserTableSlice';

function ManageUser() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userPermission = localStorage.getItem('roles');
  const breadCrumButtonClickHandler = (e, item) => {
    if (item.url === "/create-user") {
      navigate(item.url)
      dispatch(updateTableState({ flow: FLOW_TYPE.NEW }));
    }
  }
  return (
    <div className={"manage-user-page page"}>
      <Breadcrumb
        pageTitle={t("Manage User")}
        buttonList={   userPermission !== null && userPermission.includes("USER:ADD")
          ? [
          {
            variant: "contained",
            text: t("Create User"),
            url: "/create-user"
          }
        ]: [] }
        breadcrumbList={
          [
            {
              title: t("Home"),
              url: "/",
            },
            {
              title: t("User"),
              url: "/manage-user",
            }
          ] 
        }
        breadCrumButtonClickHandler={breadCrumButtonClickHandler}
        hideBreadcrumb={true}
      />
      <ManageUserTable />
    </div>
  )
}

export default ManageUser
