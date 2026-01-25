import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './ManageLocationTable.scss'

import _ from 'lodash';
// import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import IconButton from '@mui/material/IconButton';
import CardMedia from '@mui/material/CardMedia';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import { renderColumns, formatFilters } from '../../../components/MUIDataTable/MUIHelper';
import { MUIDataTable, AlertDialog } from '../../../components/index';
import { FLOW_TYPE, CRUD_ACTION, AWS_URL } from '../../../Utils/constants';

import { fetchLocationList, updateTableState, fetchLocationListTableColumnConfig } from './manageLocationTableSlice';
import { fetchLookupOptionsSearch, deleteLocation } from './ManageLocationApi';

const STORE_ID = localStorage.getItem("storeId");

function ManageLocationTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const userPermission = localStorage.getItem('roles');
  const columnsOriginalResponse = useSelector((state) => state.manageLocationTableReducer.columnsOriginalResponse);
  const data = useSelector((state) => state.manageLocationTableReducer.data);
  const loading = useSelector((state) => state.manageLocationTableReducer.loading);
  const total = useSelector((state) => state.manageLocationTableReducer.total);
  const page = useSelector((state) => state.manageLocationTableReducer.page);
  const rowsPerPage = useSelector((state) => state.manageLocationTableReducer.rowsPerPage);
  const sortBy = useSelector((state) => state.manageLocationTableReducer.sortBy);
  const sortKey = useSelector((state) => state.manageLocationTableReducer.sortKey);
  const appliedFilterList = useSelector((state) => state.manageLocationTableReducer.appliedFilterList);
  const showSessionPopup = useSelector((state) => state.loginReducer.showSessionPopup);

  const [columns, setColumns] = useState([]);
  const [columnNameToBeFetched, setColumnNameToBeFetched] = useState(null);
  const [showDeleteLocationPopup, setShowDeleteLocationPopup] = useState({
    show: false,
    data: null
  });
  const [hasInitialized, setHasInitialized] = useState(false);


  const getOptionsDelayed = useCallback(
    _.debounce((text, columnName, lookupKey, callback) => {
      if (text) {
        // getOptionsAsync(text).then(callback);
        fetchLookupOptionsSearch(columnName, [lookupKey], { ['search' + lookupKey]: text }, dispatch).then(callback);
      }
    }, 300), [],
  );

  const fetchTable = async () => {
    let filterData = {}
    if (columnsOriginalResponse.length > 0) {
      filterData = await formatFilters(columnsOriginalResponse, appliedFilterList);
      // console.log(filterData);
    }
    await dispatch(fetchLocationList({ data: filterData, params: { perPage: rowsPerPage, page: page, sortBy, sortKey } }));
    clearFilterValues();
  }

  useEffect(() => {
    // didMount
    onPageLoad();
    return () => {
      // console.log('unmount')
    }
  }, [])

  useEffect(() => {
    if (hasInitialized) {
      fetchTable();
    }
  }, [page, sortBy, sortKey, rowsPerPage, appliedFilterList, hasInitialized, showSessionPopup])


  useEffect(() => {
    if (columnNameToBeFetched) {
      let tempcolumnNameToBeFetched = columnNameToBeFetched;
      let lookupKey = '';
      // setColumnNameToBeFetched(null)
      const updateColumnIndex = columns.findIndex(el => el.name === tempcolumnNameToBeFetched);
      let inputValue = ''
      if (updateColumnIndex) {
        inputValue = columns[updateColumnIndex].options.customConfig.inputValue;
        const columnWithLookup = columnsOriginalResponse.find(el => el.fieldName === tempcolumnNameToBeFetched);
        if (columnWithLookup) {
          lookupKey = columnWithLookup.lookUp.lookupDisplay
        }
      }
      //Note:: Async option, set loader to true 
      setColumns(state => {
        let updatedState = _.cloneDeep(state);
        updatedState[updateColumnIndex].options.customConfig.loading = true
        return updatedState
      })

      //Note:: Async option, update options list and set loader to false
      getOptionsDelayed(inputValue, tempcolumnNameToBeFetched, lookupKey, (filteredOptions) => {
        setColumns(state => {
          let updatedState = _.cloneDeep(state);
          updatedState[updateColumnIndex].options.customConfig.optionList = filteredOptions
          updatedState[updateColumnIndex].options.customConfig.loading = false
          return updatedState
        })
        setColumnNameToBeFetched(null)
      });
    }
  }, [columnNameToBeFetched])

  const handleTableButtonAction = async (e, action, tableMeta) => {
    const index = tableMeta.rowIndex;
    const selectedRow = tableMeta.tableData[index];
    if (index !== -1) {
      if (action === CRUD_ACTION.EDIT) {
        dispatch(updateTableState({ selectedLocationData: selectedRow, flow: FLOW_TYPE.EDIT }));
        navigate('/create-location');
      } else if (action === CRUD_ACTION.DELETE) {
        const { locationId } = selectedRow;
        setShowDeleteLocationPopup((state) => {
          return {
            ...state,
            show: true,
            data: { locationId }
          }
        });
      }
    }
  }

  useEffect(() => {
    if (columnsOriginalResponse && columnsOriginalResponse.length > 0) {
      let updatedColumnsOriginalResponse = columnsOriginalResponse.map((el, index) => {
        return {
          ...el,
          filterList: appliedFilterList[index] ? appliedFilterList[index] : []
        }
      })
      const columns = updatedColumnsOriginalResponse.map((item, index) => {
        if (item.displayName === "Action") {
          return {
            name: "action",
            label: t("Action"),
            options: {
              filter: false,
              sort: false,
              display: userPermission !== null && userPermission.includes("LOCATION:EDIT" || "LOCATION:DELETE" ) ? true : false,
              customBodyRender: (value, tableMeta, updateValue) => {
                //  const rowIndex = tableMeta.rowIndex
                return (
                  <div className="action-buttons-wrapper">
                     {userPermission !== null && userPermission.includes("LOCATION:EDIT") &&
                     <>
                    <Tooltip title={"Edit Location"}>
                      <IconButton aria-label="edit" onClick={(e) => { handleTableButtonAction(e, CRUD_ACTION.EDIT, tableMeta) }}>
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    </>}
                    {userPermission !== null && userPermission.includes("LOCATION:DELETE") &&
                    <>
                    <Tooltip title={"Delete Location"}>
                      <IconButton aria-label="delete" onClick={(e) => { handleTableButtonAction(e, CRUD_ACTION.DELETE, tableMeta) }}>
                        <HighlightOffOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    </>
                   }
                  </div>
                )
              }
            }

          }
        }
        else if (item.displayName === "Location Name") {
          return {
            name: item.fieldName,
            label: item.displayName,
            options: {
              filter: item.isFilterField,
              sort: item.isSortField,
            }

          }
        }
        else {
          return renderColumns(item, setColumnNameToBeFetched, setColumns)
        }
      });
      setColumns(columns);
    }
  }, [columnsOriginalResponse])

  async function onPageLoad() {
    //Note:: Fetch manageLocationTableConfig 
    dispatch(updateTableState({ appliedFilterList: [], page: 0, sortBy: "", sortKey: "", rowsPerPage: 10, total: 0 }));
    // if (columnsOriginalResponse.length === 0) {
    await dispatch(fetchLocationListTableColumnConfig({ params: {} }));
    // }
    setHasInitialized(true);
  }

  const handleFilterSubmit = applyFilters => {
    let filterList = applyFilters();
    // Update filters in columnsConfig and reset page to 0
    dispatch(updateTableState({ appliedFilterList: filterList, page: 0 }));
    // Update filters in redux 
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state)
      updatedColumns = updatedColumns.map((el, i) => {
        if (filterList[i] && filterList[i].length > 0) {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: filterList[i]
            }
          }
        } else {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: []
            }
          }
        }
      })
      return updatedColumns
    });
  };

  const handleReset = (applyFilters) => {
    setColumns((state) => {
      let updatedColumns = _.cloneDeep(state)
      updatedColumns = updatedColumns.map((el, i) => {
        return {
          ...el,
          options: {
            ...el.options,
            filterList: []
          }
        }
      })
      return updatedColumns
    });

    // Update the filter in redux state
    let updatedAppliedFilterList = appliedFilterList.map((el) => {
      return []
    });
    // and reset page to 0
    dispatch(updateTableState({ appliedFilterList: updatedAppliedFilterList, page: 0 }));
    // closes 
    applyFilters();
  }

  const options = {
    responsive: "vertical",
    selectableRows: 'none',
    search: false,
    print: false,
    download: false,
    viewColumns: false,
    fixedHeader: true,
    filter: false,
    fixedSelectColumn: true,
    tableBodyHeight: '400px',
    serverSide: true,
    count: total,
    page: page,
    rowsPerPage: rowsPerPage,
    rowsPerPageOptions: [5, 10, 50, 100],
    confirmFilters: true,
    customFilterDialogFooter: (currentFilterList, applyNewFilters) => {
      return (
        <div className="custom-filter-dialog-footer-wrapper" style={{ marginTop: '40px' }}>
          <Button variant="contained" onClick={() => handleFilterSubmit(applyNewFilters)}>Apply Filters</Button>
          <Button variant="text" onClick={() => handleReset(applyNewFilters)}>Reset</Button>
        </div>
      );
    },
    onColumnSortChange: async (changedColumn, direction) => {
      await dispatch(updateTableState({ sortBy: changedColumn, sortKey: direction, page: 0 }));
    },
    onTableChange: (action, tableState) => {
      const { page, rowsPerPage } = tableState;
      if (action === "changePage") {
        dispatch(updateTableState({ page }));
      } else if (action === "changeRowsPerPage") {
        dispatch(updateTableState({ rowsPerPage, page: 0 }));
      }
    },
    onFilterChange: (column, filterList, type, changedColumnIndex, displayData) => {
      if (type === 'chip') {
        dispatch(setColumnNameToBeFetched(null))
      } else if (type === 'reset') {

      }
    },
  }

  const closeChipHandler = (index) => {
    // Update the filter from columns state
    setColumns(state => {
      let updatedColumns = _.cloneDeep(state);
      updatedColumns = updatedColumns.map((el, i) => {
        if (i === index) {
          return {
            ...el,
            options: {
              ...el.options,
              filterList: []
            }
          }
        } else {
          return el
        }
      })
      return updatedColumns;
    })
    // Update the filter in redux state
    let updatedAppliedFilterList = appliedFilterList.map((el, i) => {
      if (i === index) {
        return el = []
      } else {
        return el
      }
    })
    // and reset page to 0
    dispatch(updateTableState({ appliedFilterList: updatedAppliedFilterList, page: 0 }));
  }

  const clearFilterValues = () => {
    // Update the filter from columns state
    setColumns(state => {
      let updatedColumns = _.cloneDeep(state);
      updatedColumns = updatedColumns.map((el, i) => {
        return {
          ...el,
          options: {
            ...el.options,
            filterList: []
          }
        }
      })
      return updatedColumns;
    })
  }


  const closeModalHandler = (modalName) => {
    if (modalName === "showDeleteLocationPopup") {
      setShowDeleteLocationPopup((state => {
        return {
          ...state,
          show: false
        }
      }))
    }
  }

  const deleteLocationHandler = async () => {
    dispatch(updateTableState({ loading: true }));
    const { locationId } = showDeleteLocationPopup.data;
    const response = await deleteLocation({ locationId }, { isDeleted: true }, dispatch);
    if (response) {
      setShowDeleteLocationPopup((state) => {
        return {
          ...state,
          show: false,
          data: null
        }
      })
      await fetchTable();
    }
  }


  return (
    <div className="manage-location-table">
      <AlertDialog
        title={t("Confirmation")}
        modalName="delete-location-modal"
        open={showDeleteLocationPopup.show}
        hideCloseButton={true}
        closeModalHandler={() => { closeModalHandler('showDeleteLocationPopup') }}
        submitModalHandler={deleteLocationHandler}
      >
        <span>Are you sure you want to delete this location?</span>
      </AlertDialog>
      <MUIDataTable
        title={t("Location")}
        tableClassName={`manage-location-table compact`}
        columns={columns}
        data={data}
        options={options}
        loading={loading}
        appliedFilterList={appliedFilterList}
        closeChipHandler={closeChipHandler}
      />
    </div>
  )
}

export default ManageLocationTable
