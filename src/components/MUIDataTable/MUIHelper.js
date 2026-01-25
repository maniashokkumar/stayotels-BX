import { AsyncAutoComplete,DesktopdatePicker } from '../index';
import { isArray, isObject } from '../../Utils/commonUtils'
import { t } from "i18next";
import _ from 'lodash';
//import {DesktopDatePicker,MuiPickersUtilsProvider} from '@mui/lab';
//import AdapterDateFns from '@mui/lab/AdapterDateFns';
//import LocalizationProvider from '@mui/lab/LocalizationProvider';
import {TextField} from '@mui/material';
import moment from "moment";
// import Tooltip from '@mui/material/Tooltip';
// import Link from '@mui/material/Link';


function defineInputType(type) {
  if (type === "String") {
    return "textField"
  } else if (type === "lookup") {
    return "select"
  } else  if(type === "Date"){
    return "date";
  }else{
    return "textField"
  }
}

function defineDataType(type) {
  if (type === "String") {
    return "textField"
  } else if (type === "lookup") {
    return "custom"
  } else if(type === "Date"){
    return "custom";
  }else {
    return "textField"
  }
}

function defineFilterPrefix(type) {
  if (type === "String") {
    return "search"
  } else if (type === "lookup") {
    return "search"
  } else if (type === "date") {
    return "datefrom"
  } else {
    return "search"
  }
}

export const formatFilters = (columns, appliedFilters) => {
  let lookupPrefix = "";
  let result = {}
  appliedFilters.forEach((item, index) => {
    if (columns[index].lookUp) {
      lookupPrefix = "Id";
    }
    if (item.length > 0) {
      if (isArray(item)) {
        if (isArray(item[0])) {
          // console.log('array')
          if(columns[index].fieldName==="product"){
            result["reviewedFor"] = item[0];
          }else if(columns[index].fieldName==="amenities"){
            result["amenitiesFor"] = item[0];
          }else{
              result[columns[index].fieldName + lookupPrefix ] = item[0];
          }
        } else if (isObject(item[0])) {
           if(columns[index].fieldName==="product"){
            result["reviewedFor"] = item[0].value;
           } else if(columns[index].fieldName==="roleName"){
            result["roleId"] = item[0].value;
           } else if(columns[index].fieldName==="locationName"){
            result["locationId"] = item[0].value;
           }else if(columns[index].fieldName==="roomName"){
            result["roomId"] = item[0].value;
           }else if(columns[index].fieldName==="category"){
             result["servicesId"] = item[0].value;
          }else if(columns[index].fieldName==="assignedToUser"){
             result["assignedTo"] = item[0].value;
          }
          else if(columns[index].fieldName==="product.productName"){
            result["productId"] = item[0].value;
         }
          else{
           result[columns[index].fieldName + lookupPrefix ] = item[0].value;
         }
        } else {
          // console.log('for text') // cdngtereviewRating
          if(columns[index].fieldName==="startDate" || columns[index].fieldName==="expiryDate"||columns[index].fieldName==="publishDate"||columns[index].fieldName==="orderDate"||columns[index].fieldName==="createdOn"){
             result["datefrom" + columns[index].fieldName] = item[0];
          }else if(columns[index].fieldName==="reviewRating"){
             result["cdngte" + columns[index].fieldName] = item[0];
          } else{
             result[defineFilterPrefix(columns[index].dataType)+ columns[index].fieldName] = item[0];
          }
        }
      } else {
         if(columns[index].fieldName==="startDate" || columns[index].fieldName==="expiryDate"||columns[index].fieldName==="publishDate"||columns[index].fieldName==="orderDate"||columns[index].fieldName==="createdOn"){
             result["datefrom" + columns[index].fieldName] = item[0];
          }else if(columns[index].fieldName==="reviewRating"){
             result["cdngte" + columns[index].fieldName] = item[0];
          } 
          else{
             result[defineFilterPrefix(columns[index].dataType)+columns[index].fieldName] = item[0];
          }
      }
    }
  });
  return result
}

export const renderColumns = (item, setColumnNameToBeFetched, setColumns) => {

  //alert(item.fieldName);

  return {
    name: item.fieldName,
    label: t(item.displayName),
    filterPrefix: defineFilterPrefix(item.dataType),
    options: {
      filter: item.isFilterField,
      sort: item.isSortField,
      display: item.isDisplayField,
      inputType: defineInputType(item.dataType),
      filterType: defineDataType(item.dataType),
      filterList: item.filterList || [],
      setCellProps: () => ({style: { wordWrap: "break-word"}}),
      customConfig: {
        inputValue: "",
        optionList: [],
        loading: false,
      },
      // customBodyRender: (value, tableMeta, updateValue) => {   
      //         //return value.length>100 ? value.substring(1,100) + '....' : value;
      // },
      filterOptions: {
       display: (filterList, onChange, index, column) => {
           const columnName = column.name ? column.name : "";
         //  console.log("Test checking data>>>>>>", column);
         //  console.log("checking filterList data>>>>>>", filterList);
          // alert(1);
           if (column.inputType && column.inputType === "select") {
             return (
              <AsyncAutoComplete
                id={column.name}
                label={t(item.displayName)}
                placeholder={`Select ${item.displayName}`}
                // hideCloseIcon={true}
                options={column.customConfig.optionList}
                loading={column.customConfig.loading}
                // inputValue={columnInputValue[columnName]}
                inputValue={column.customConfig.inputValue}
                value={filterList[index][0]}
                onChange={(e, value) => {
                  if (!value) {
                    filterList[index] = []
                  } else {
                    filterList[index] = [value]
                  }

                }}
                onInputChange={(e, value) => {
                  setColumns(state => {
                    let updatedState = _.cloneDeep(state);
                    updatedState[index].options.customConfig.inputValue = value;
                    updatedState[index].options.customConfig.loading = false;
                    return updatedState
                  });
                  if (!value) {
                    setColumns(state => {
                      let updatedState = _.cloneDeep(state);
                      updatedState[index].options.customConfig.loading = false;
                      return updatedState
                    });
                  }

                  if (value) {
                    setColumnNameToBeFetched(columnName)
                  }

                }}
                getOptionLabel={(option) => {
                  if (isArray(option)) {
                    return ""
                  } else {
                    return option.label
                  }
                }}
                variant={"standard"}
              />
             );
          } else if(column.inputType && column.inputType === "date"){
          // console.log("column",column)
          // console.log("column::::",filterList[index][0])
            return (
                <DesktopdatePicker       
                   id={column.name}            
                   label={t(item.displayName)}
                   value={filterList[index][0]?filterList[index][0]:null}                    
                   loading={column.customConfig.loading}
                   inputValue={column.customConfig.inputValue}
                   onChange={(value) => {
                        // console.log("value ::::", value);
                        if (!value) {
                            filterList[index] = null
                        } else {
                           // let date= moment(value).format('YYYY-MM-DD');
                            let date= (value).format('YYYY-MM-DD');
                           // alert( date.toISOString());
                          // console.log("moment date ::::", date);
                            filterList[index][0] = date + "T00:00:00.000Z";
                           // console.log("filterList ::::", filterList[index][0]);
                            setColumns(state => {
                            let updatedState = _.cloneDeep(state);
                            return updatedState
                           });
                         if (!value) {
                          setColumns(state => {
                            let updatedState = _.cloneDeep(state);
                            return updatedState
                          });
                         }
                    }
  
                   }}

                   onInputChange={(e,value) => {
                   setColumns(state => {
                    let updatedState = _.cloneDeep(state);
                    updatedState[index].options.customConfig.inputValue = value;
                    updatedState[index].options.customConfig.loading = false;
                    return updatedState
                   });
                   if (!value) {
                    setColumns(state => {
                      let updatedState = _.cloneDeep(state);
                      updatedState[index].options.customConfig.loading = false;
                      return updatedState
                    });
                   }
                }}

                    fullWidth={true}
                    renderInput={(params) => <TextField  variant={"standard"} helperText={params?.inputProps?.placeholder} fullWidth={true}  {...params} />}
                    variant={"standard"}
                  />
             );
        }else{
            // alert(item.fieldName);
             console.log('column not configured')
        }
       }
      },
      customFilterListOptions: {
        render: v => {
          if (isArray(v)) {
            if (isArray(v[0])) {
              return v[0].map(l => l.id)
            } else {
              return v.map(l => l.id)
            }
          } else {
            return v;
          }
        },
        update: (filterList, filterPos, index) => {
         filterList[index].splice(filterPos, 1);
          return filterList;
        }
      },
    }
  }
}