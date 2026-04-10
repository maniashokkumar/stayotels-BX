import React from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { default as Table } from "mui-datatables";
import { isArray, isObject } from '../../Utils/commonUtils';
import IconButton from '@mui/material/IconButton';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
// import MUIHelper from '../MUIDataTable/MUIHelper'
import Tooltip from '@mui/material/Tooltip';
import format from 'date-fns/format';
import { Loader } from '../index'
import './MUIDataTable.scss';


function MUIDataTable({ tableClassName, title, data, columns, options, loading, appliedFilterList, closeChipHandler }) {
  const MUITheme = () =>
    createTheme({
      typography: {
        fontFamily: 'Rubik',
        fontWeight: "bold",
      },
      components: {
        MUIDataTableToolbar: {
          styleOverrides: {
            filterPaper: {
              width: "450px",
            },
          },
        },
        components: {
          MUIDataTableHeadCell: {
            styleOverrides: {
              root: {
                "&.Mui-sortActive": {
                  "&&": {
                    color: "white",
                    "& * ": {
                      color: "white"
                    }
                  }
                }
              }
            }
          },

          // MuiTableSortLabel: {
          //   styleOverrides: {
          //     root: {
          //       color: "coral",
          //       "&:hover": {
          //         color: "white"
          //       },
          //       "&.Mui-active": {
          //         "&&": {
          //           color: "white", // Change the active color to blue

          //           "& * ": {
          //             color: "white"
          //           }
          //         }
          //       }
          //     },
          //     icon: {
          //       color: "white"
          //     }
          //   }
          // },

          MUIDataTableToolbar: {

            styleOverrides: {
              MuiDataTable: {
                tableRoot: {
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                  },
                },
              },
              MUIDataTableBodyCell: {
                root: {
                  '&.odd-row': {
                    backgroundColor: 'lightgray',
                  },
                },
              },
              filterPaper: {
                width: "450px",
              },
            },
          },
          MUIDataTableFilter: {
            styleOverrides: {
              resetLink: {
                display: "none"
              }
            }
          },
        },
        MUIDataTableFilter: {
          styleOverrides: {
            resetLink: {
              display: "none"
            }
          }
        },
      },

    });
  // console.log(data, "data muiDattable")

  const CustomChip = ({ label, value, inputType, index }) => {

    if (inputType === "date") {
      value = value.split("T")[0];
    }
    return (
      <>
        <div className="filter-chip">
          <div>
            <p className="column-label">{label}</p>
            <p className="column-value">{value}</p>
          </div>
          <IconButton className="close-icon" onClick={() => { closeChipHandler(index) }}>
            <CloseOutlinedIcon />
          </IconButton>
        </div>
      </>
    );
  };

  const CustomFilterList = (props) => {
    let formattedList = [];
    columns && columns.length > 0 && appliedFilterList && appliedFilterList.length > 0 && appliedFilterList.forEach((item, index) => {
      if (item.length > 0) {
        if (isArray(item)) {
          if (isArray(item[0])) {
            console.log('array')
            formattedList.push({ label: columns[index].label, value: item[0], inputType: columns[index].options.inputType, index })
          } else if (isObject(item[0])) {
            console.log('obj');
            formattedList.push({ label: columns[index].label, value: item[0].label, inputType: columns[index].options.inputType, index })
          } else {
            console.log('for text')
            formattedList.push({ label: columns[index].label, value: item[0], inputType: columns[index].options.inputType, index })
          }
        } else {
          formattedList.push({ label: columns[index].label, value: item[0], inputType: columns[index].options.inputType, index })
        }
      }
      // console.log("formattedList ::::",formattedList)
    });
    return (
      <div className="filter-chip-wrapper">
        {formattedList && formattedList.length > 0 && formattedList.map((el, i) => {
          return <CustomChip key={el.label + i} {...el} />
        })}
      </div>
    )
  };

  function formatNumber(value) {
    let [integerPart, decimalPart] = value.toString().split(".");
    if (integerPart.length === 1) {
      integerPart = "0" + integerPart;
    }
    if (decimalPart && decimalPart.length === 1) {
      decimalPart = decimalPart + "0";
    }
    return integerPart + ":" + (decimalPart || "00");
  }
  const truncateText = (value, inputType, label) => {
    // console.log("Value",value)
    try {
      if ((inputType === 'date' || inputType === 'Date') && value) {
        const date = new Date(value);
        return format(date, 'dd/MM/yyyy');
      } else if (inputType === 'status') {
        return (value === true || value === "true") ? 'Active' : 'Inactive';
      } else if (inputType === 'time') {
        return formatNumber(value);
      } else if (value === false && inputType !== 'status') {
        return 'false'
      }

      const safeLabel = React.isValidElement(label) ? label.props.title : label;
      if (safeLabel === 'Date' && value) {
        const date = new Date(value);
        return format(date, 'dd/MM/yyyy');
      }

      if (React.isValidElement(value)) {
        return value;
      }

      const stringValue = typeof value === 'string' ? value : value?.toString();
      if (stringValue?.length > 25) {
        return (
          <Tooltip title={stringValue}>
            <span>{stringValue.substring(0, 25)}...</span>
          </Tooltip>
        );
      }

      if (value)

        return stringValue || '';
    } catch (error) {
      console.error("Error in truncateText:", error);
      return 'Invalid Data';
    }
  };

  const modifiedColumns = columns.map((col) => ({
    ...col,
    options: {
      ...col.options,
      ...((col.name !== 'action' && col.name !== 'dataId' && col.name !== "avatarPath" && col.name !== "list-dataset"
        && typeof col.options?.customBodyRender !== 'function') && {
        customBodyRenderLite: (dataIndex) => {
          console.log(`Rendering column: ${col.name} at dataIndex: ${dataIndex}`);
          const value = data[dataIndex]?.[col.name];
          console.log("VALUE:::", value)
          // if (value === undefined || value === null || value === []) {
          //   // return Array.isArray(subForm) && subForm[0]?.dataType === 'subForm'  ? [] : 'N/A';
          //   return 'N/A'
          // }
          if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
            return 'N/A';
          }

          // console.log("value",data[dataIndex]?.[col.name])
          return truncateText(value, col.options.inputType, col.label);
        },
      }),
    },
  }));

  return (
    <div className={`mui-table ${tableClassName}`}>
      {loading && <Loader pageLoader={true} />}
      <ThemeProvider theme={MUITheme}>
        <Table
          title={title}
          data={data}
          columns={modifiedColumns}
          options={options}
          components={{
            TableFilterList: CustomFilterList,
          }}
        />
      </ThemeProvider>
    </div>
  )
}

export default MUIDataTable;
