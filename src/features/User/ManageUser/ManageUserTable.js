import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./ManageUserTable.scss";

import _ from "lodash";
// import axios from 'axios';
import { useTranslation } from "react-i18next";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import IconButton from "@mui/material/IconButton";
import CardMedia from "@mui/material/CardMedia";
import { showSnackbar } from "../../../redux/reducer/appSlice";
import {
  renderColumns,
  formatFilters,
} from "../../../components/MUIDataTable/MUIHelper";
import { MUIDataTable, AlertDialog } from "../../../components/index";
import {
  FLOW_TYPE,
  CRUD_ACTION,
  DEACTIVATE_ACTIVATE_USER,
  AWS_URL,
} from "../../../Utils/constants";
import PasswordIcon from "@mui/icons-material/Password";
import {
  fetchUserList,
  updateTableState,
  fetchUserListTableColumnConfig,
} from "./manageUserTableSlice";
import {
  fetchLookupOptionsSearch,
  deactivateActivateUser,
  deleteUser,
  resendAPI,
} from "./ManageUserApi";
import ReplayIcon from "@mui/icons-material/Replay";

const STORE_ID = localStorage.getItem("storeId");

function ManageUserTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userId = window.localStorage.getItem("userId");

  const columnsOriginalResponse = useSelector(
    (state) => state.manageUserTableReducer.columnsOriginalResponse
  );
  const data = useSelector((state) => state.manageUserTableReducer.data);
  // const columns = useSelector((state) => state.manageUserTableReducer.columns);
  const loading = useSelector((state) => state.manageUserTableReducer.loading);

  // const columnNameToBeFetched = useSelector((state) => state.manageUserTableReducer.columnNameToBeFetched);
  const [flg, setFlg] = useState("");
  const total = useSelector((state) => state.manageUserTableReducer.total);
  const page = useSelector((state) => state.manageUserTableReducer.page);
  const rowsPerPage = useSelector(
    (state) => state.manageUserTableReducer.rowsPerPage
  );
  const sortBy = useSelector((state) => state.manageUserTableReducer.sortBy);
  const sortKey = useSelector((state) => state.manageUserTableReducer.sortKey);

  const appliedFilterList = useSelector(
    (state) => state.manageUserTableReducer.appliedFilterList
  );
  const showSessionPopup = useSelector(
    (state) => state.loginReducer.showSessionPopup
  );
  const [columns, setColumns] = useState([]);
  const [columnNameToBeFetched, setColumnNameToBeFetched] = useState(null);
  const [showDeleteUserPopup, setShowDeleteUserPopup] = useState({
    show: false,
    data: null,
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  const userPermission = localStorage.getItem("roles");

  const getOptionsDelayed = useCallback(
    _.debounce((text, columnName, lookupKey, callback) => {
      if (text) {
        // getOptionsAsync(text).then(callback);
        fetchLookupOptionsSearch(
          columnName,
          [lookupKey],
          { ["search" + lookupKey]: text },
          dispatch
        ).then(callback);
      }
    }, 300),
    []
  );

  const fetchTable = async () => {
    let filterData = {};
    if (columnsOriginalResponse.length > 0) {
    }
    filterData = await formatFilters(
      columnsOriginalResponse,
      appliedFilterList
    );
    await dispatch(
      fetchUserList({
        data: filterData,
        params: { perPage: rowsPerPage, page: page, sortBy, sortKey },
      })
    );
    clearFilterValues();
  };

  useEffect(() => {
    // didMount
    onPageLoad();
    const roleDescription = window.localStorage.getItem("roleDescription");
    setFlg(roleDescription);
    return () => {
      // console.log('unmount')
    };
  }, []);

  useEffect(() => {
    if (hasInitialized) {
      fetchTable();
    }
  }, [
    page,
    sortBy,
    sortKey,
    rowsPerPage,
    appliedFilterList,
    hasInitialized,
    showSessionPopup,
  ]);

  useEffect(() => {
    if (columnNameToBeFetched) {
      let tempcolumnNameToBeFetched = columnNameToBeFetched;
      let lookupKey = "";
      const updateColumnIndex = columns.findIndex(
        (el) => el.name === tempcolumnNameToBeFetched
      );
      let inputValue = "";
      if (updateColumnIndex) {
        inputValue = columns[updateColumnIndex].options.customConfig.inputValue;
        const columnWithLookup = columnsOriginalResponse.find(
          (el) => el.fieldName === tempcolumnNameToBeFetched
        );
        if (columnWithLookup) {
          lookupKey = columnWithLookup?.lookUp?.lookupDisplay;
        }
      }

      setColumns((state) => {
        let updatedState = _.cloneDeep(state);
        updatedState[updateColumnIndex].options.customConfig.loading = true;
        return updatedState;
      });

      getOptionsDelayed(
        inputValue,
        tempcolumnNameToBeFetched,
        lookupKey,
        (filteredOptions) => {
          setColumns((state) => {
            let updatedState = _.cloneDeep(state);
            updatedState[updateColumnIndex].options.customConfig.optionList =
              filteredOptions;
            updatedState[
              updateColumnIndex
            ].options.customConfig.loading = false;
            return updatedState;
          });
          setColumnNameToBeFetched(null);
        }
      );
    }
  }, [columnNameToBeFetched]);

  const handleTableButtonAction = async (e, action, tableMeta) => {
    const index = tableMeta.rowIndex;
    const selectedRow = tableMeta.tableData[index];
    if (index !== -1) {
      if (action === CRUD_ACTION.EDIT) {
        dispatch(
          updateTableState({
            selectedUserData: selectedRow,
            flow: FLOW_TYPE.EDIT,
          })
        );
        navigate("/create-user");
      } else if (action === DEACTIVATE_ACTIVATE_USER) {
        dispatch(updateTableState({ loading: true }));
        let tableData = _.cloneDeep(tableMeta.tableData);
        const { userId, userName, isActive } = selectedRow;
        const response = await deactivateActivateUser(
          { userId, userName },
          { isActive: isActive ? false : true },
          dispatch
        );
        if (response === "Success") {
          tableData[index].isActive = isActive ? false : true;
          dispatch(updateTableState({ data: tableData, loading: false }));
        }
        dispatch(updateTableState({ loading: false }));
      } else if (action === CRUD_ACTION.DELETE) {
        const { userId, userName } = selectedRow;
        setShowDeleteUserPopup((state) => {
          return {
            ...state,
            show: true,
            data: { userName, userId },
          };
        });
      }
    }
  };
  const handleTableButtonActionActiveandDeactive = async (
    e,
    action,
    tableMeta
  ) => {
    // if (flg !== "Admin") {
    //   dispatch(showSnackbar({ type: "error", message: "Permission Denied: You don't have access to this action." }));
    //   return;
    // }

    const index = tableMeta.rowIndex;
    const selectedRow = tableMeta.tableData[index];
    if (index !== -1) {
      if (action === CRUD_ACTION.EDIT) {
        dispatch(
          updateTableState({
            selectedUserData: selectedRow,
            flow: FLOW_TYPE.EDIT,
          })
        );
        navigate("/create-user");
      } else if (action === DEACTIVATE_ACTIVATE_USER) {
        dispatch(updateTableState({ loading: true }));
        let tableData = _.cloneDeep(tableMeta.tableData);
        const { userId, userName, isActive } = selectedRow;
        const response = await deactivateActivateUser(
          { userId, userName },
          { isActive: isActive ? false : true },
          dispatch
        );
        if (response === "Success") {
          tableData[index].isActive = isActive ? false : true;
          dispatch(updateTableState({ data: tableData, loading: false }));
        }
        dispatch(updateTableState({ loading: false }));
      } else if (action === CRUD_ACTION.DELETE) {
        const { userId, userName } = selectedRow;
        setShowDeleteUserPopup((state) => {
          return {
            ...state,
            show: true,
            data: { userName, userId },
          };
        });
      }
    }
  };

  const alertThrowDectivateClick = () => {
    dispatch(
      showSnackbar({
        type: "error",
        message: "Currently logged-in user cannot be activated or deactivated.",
      })
    );
  };
  const alertThrowDeleteClick = () => {
    dispatch(
      showSnackbar({
        type: "error",
        message: "Currently logged-in user cannot be deleted.",
      })
    );
  };

  const sendCode = async (email) => {
    try {
      const payload = { email: email };
      const res = await resendAPI(payload, dispatch);

      if (res === "success") {
        dispatch(
          showSnackbar({
            type: "success",
            message: "OTP sent successfully!",
          })
        );
      }
    } catch (error) {
      console.log("Error sending code:", error);
    }
  };

  useEffect(() => {
    if (columnsOriginalResponse && columnsOriginalResponse.length > 0) {
      let updatedColumnsOriginalResponse = columnsOriginalResponse.map(
        (el, index) => {
          return {
            ...el,
            filterList: appliedFilterList[index]
              ? appliedFilterList[index]
              : [],
          };
        }
      );

      const columns = updatedColumnsOriginalResponse.map((item, index) => {
        if (item.displayName === "Action") {
          return {
            name: "action",
            label: t("Action"),
            options: {
              filter: false,
              sort: false,
              // display: userPermission !== null && userPermission.includes("USER:ACTIVATE" || "USER:EDIT" || "USER:DELETE" || "USER:OTP" ) ? true : false,
              // display:  true,
              display:
                userPermission !== null &&
                (userPermission.includes("USER:ACTIVATE") ||
                  userPermission.includes("USER:EDIT") ||
                  userPermission.includes("USER:DELETE") ||
                  userPermission.includes("USER:OTP")),

              customBodyRender: (value, tableMeta, updateValue) => {
                const rowIndex = tableMeta.rowIndex;
                const userEmail = tableMeta.tableData[rowIndex]?.userEmail; // Assuming 'email' field exists in table data

                return (
                  <div className="action-buttons-wrapper">
                    {/* Activate / Deactivate Button */}

                    {userPermission !== null &&
                      userPermission.includes("USER:ACTIVATE") &&
                      (tableMeta.tableData[rowIndex].userId !== userId ? (
                        <Tooltip
                          title={
                            tableMeta.tableData[rowIndex].isActive
                              ? "Deactivate User"
                              : "Activate User"
                          }
                        >
                          <IconButton
                            aria-label="deactivate"
                            onClick={(e) =>
                              handleTableButtonActionActiveandDeactive(
                                e,
                                DEACTIVATE_ACTIVATE_USER,
                                tableMeta
                              )
                            }
                            className={`isActive ${
                              tableMeta.tableData[rowIndex].isActive
                                ? "activeUser"
                                : ""
                            }`}
                          >
                            {tableMeta.tableData[rowIndex].isActive ? (
                              <ToggleOnOutlinedIcon />
                            ) : (
                              <ToggleOffOutlinedIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip
                          title={
                            tableMeta.tableData[rowIndex].isActive
                              ? "Deactivate User"
                              : "Activate User"
                          }
                        >
                          <IconButton
                            aria-label="deactivate"
                            onClick={alertThrowDectivateClick}
                            className={`isActive ${
                              tableMeta.tableData[rowIndex].isActive
                                ? "activeUser"
                                : ""
                            }`}
                          >
                            {tableMeta.tableData[rowIndex].isActive ? (
                              <ToggleOnOutlinedIcon disabled />
                            ) : (
                              <ToggleOffOutlinedIcon disabled />
                            )}
                          </IconButton>
                        </Tooltip>
                      ))}

                    {/* Edit Button */}
                    {userPermission !== null &&
                      userPermission.includes("USER:EDIT") && (
                        <Tooltip title="Edit User">
                          <IconButton
                            aria-label="edit"
                            onClick={(e) => {
                              handleTableButtonAction(
                                e,
                                CRUD_ACTION.EDIT,
                                tableMeta
                              );
                            }}
                          >
                            <EditOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                    {/* Delete Button */}
                    {userPermission !== null &&
                      userPermission.includes("USER:DELETE") &&
                      (tableMeta.tableData[rowIndex].userId !== userId ? (
                        <Tooltip title="Delete User">
                          <IconButton
                            aria-label="delete"
                            onClick={(e) =>
                              handleTableButtonAction(
                                e,
                                CRUD_ACTION.DELETE,
                                tableMeta
                              )
                            }
                          >
                            <HighlightOffOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Delete User">
                          <IconButton
                            aria-label="delete"
                            onClick={alertThrowDeleteClick}
                          >
                            <HighlightOffOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      ))}

                    {userPermission !== null &&
                      userPermission.includes("USER:OTP") &&
                      (tableMeta.tableData[rowIndex].isEmailVerified === null ||
                      false ? (
                        <Tooltip title={"Resend OTP"}>
                          <IconButton
                            aria-label="Resend OTP"
                            onClick={() => sendCode(userEmail)}
                          >
                            <PasswordIcon />
                          </IconButton>
                        </Tooltip>
                      ) : null)}
                  </div>
                );
              },
            },
          };
        } else {
          return renderColumns(item, setColumnNameToBeFetched, setColumns);
        }
      });

      setColumns(columns);
    }
  }, [columnsOriginalResponse]);

  async function onPageLoad() {
    //Note:: Fetch manageUserTableConfig
    dispatch(
      updateTableState({
        appliedFilterList: [],
        page: 0,
        sortBy: "",
        sortKey: "",
        rowsPerPage: 10,
        total: 0,
      })
    );
    if (columnsOriginalResponse.length === 0) {
      await dispatch(fetchUserListTableColumnConfig({ params: {} }));
    }
    setHasInitialized(true);
  }

  const handleFilterSubmit = (applyFilters) => {
    let filterList = applyFilters();
    // Update filters in columnsConfig and reset page to 0
    dispatch(updateTableState({ appliedFilterList: filterList, page: 0 }));
    // Update filters in redux
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state);
      updatedColumns = updatedColumns.map((el, i) => {
        if (filterList[i] && filterList[i].length > 0) {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: filterList[i],
            },
          };
        } else {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: [],
            },
          };
        }
      });
      return updatedColumns;
    });
  };

  const handleReset = (applyFilters) => {
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state);
      updatedColumns = updatedColumns.map((el, i) => {
        return {
          ...el,
          options: {
            ...el.options,
            filterList: [],
          },
        };
      });
      return updatedColumns;
    });

    // Update the filter in redux state
    let updatedAppliedFilterList = appliedFilterList.map((el) => {
      return [];
    });
    // and reset page to 0
    dispatch(
      updateTableState({ appliedFilterList: updatedAppliedFilterList, page: 0 })
    );
    // closes
    applyFilters();
  };

  const options = {
    responsive: "vertical",
    selectableRows: "none",
    search: false,
    print: false,
    download: false,
    viewColumns: false,
    fixedHeader: true,
    filter: false,
    fixedSelectColumn: true,
    tableBodyHeight: "400px",
    serverSide: true,
    count: total,
    page: page,
    rowsPerPage: rowsPerPage,
    rowsPerPageOptions: [5, 10, 50, 100],
    confirmFilters: true,
    customFilterDialogFooter: (currentFilterList, applyNewFilters) => {
      return (
        <div
          className="custom-filter-dialog-footer-wrapper"
          style={{ marginTop: "40px" }}
        >
          <Button
            variant="contained"
            onClick={() => handleFilterSubmit(applyNewFilters)}
          >
            Apply Filters
          </Button>
          <Button variant="text" onClick={() => handleReset(applyNewFilters)}>
            Reset
          </Button>
        </div>
      );
    },
    onColumnSortChange: async (changedColumn, direction) => {
      await dispatch(
        updateTableState({ sortBy: changedColumn, sortKey: direction, page: 0 })
      );
    },
    onTableChange: (action, tableState) => {
      const { page, rowsPerPage } = tableState;
      if (action === "changePage") {
        dispatch(updateTableState({ page }));
      } else if (action === "changeRowsPerPage") {
        dispatch(updateTableState({ rowsPerPage, page: 0 }));
      }
    },
    onFilterChange: (
      column,
      filterList,
      type,
      changedColumnIndex,
      displayData
    ) => {
      if (type === "chip") {
        dispatch(setColumnNameToBeFetched(null));
      } else if (type === "reset") {
      }
    },
  };

  const closeChipHandler = (index) => {
    // Update the filter from columns state
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state);
      updatedColumns = updatedColumns.map((el, i) => {
        if (i === index) {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: [],
            },
          };
        } else {
          return el;
        }
      });
      return updatedColumns;
    });
    // Update the filter in redux state
    let updatedAppliedFilterList = appliedFilterList.map((el, i) => {
      if (i === index) {
        return (el = []);
      } else {
        return el;
      }
    });
    // and reset page to 0
    dispatch(
      updateTableState({ appliedFilterList: updatedAppliedFilterList, page: 0 })
    );
  };

  const clearFilterValues = () => {
    // Update the filter from columns state
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state);
      updatedColumns = updatedColumns.map((el, i) => {
        return {
          ...el,
          options: {
            ...el.options,
            filterList: [],
          },
        };
      });
      return updatedColumns;
    });
  };

  const closeModalHandler = (modalName) => {
    if (modalName === "showDeleteUserPopup") {
      setShowDeleteUserPopup((state) => {
        return {
          ...state,
          show: false,
        };
      });
    }
  };

  const deleteUserHandler = async () => {
    dispatch(updateTableState({ loading: true }));
    const { userId, userName } = showDeleteUserPopup.data;
    const response = await deleteUser(
      { userId, userName },
      { isDeleted: true },
      dispatch
    );
    if (response === "Success") {
      setShowDeleteUserPopup((state) => {
        return {
          ...state,
          show: false,
          data: null,
        };
      });
      await fetchTable();
    }
  };

  return (
    <div className="manage-user-table">
      <AlertDialog
        title={t("Confirmation")}
        modalName="delete-user-modal"
        open={showDeleteUserPopup.show}
        hideCloseButton={true}
        closeModalHandler={() => {
          closeModalHandler("showDeleteUserPopup");
        }}
        submitModalHandler={deleteUserHandler}
      >
        <span>Are you sure you want to delete this user?</span>
      </AlertDialog>
      <MUIDataTable
        title={t("User")}
        tableClassName={`manage-user-table compact`}
        columns={columns}
        data={data}
        options={options}
        loading={loading}
        appliedFilterList={appliedFilterList}
        closeChipHandler={closeChipHandler}
      />
    </div>
  );
}

export default ManageUserTable;
