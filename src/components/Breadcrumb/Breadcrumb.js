import React from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Stack from '@mui/material/Stack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import './Breadcrumb.scss';

function Breadcrumb({ pageTitle, buttonList, breadcrumbList, breadCrumButtonClickHandler, rmMargin }) {
  const navigate = useNavigate();

  return (
    <>
      <Stack spacing={0}>
        <Box
          component="div"
          className={`breadcrumb-wrapper`}
          sx={{ marginBottom: rmMargin ? 0 : '15px' }}>
          <div>
            {pageTitle && <h2 className="page-title">{pageTitle}</h2>}
            {breadcrumbList && breadcrumbList.length > 0 &&
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" className="navigator" />}
                aria-label="breadcrumb"
                className="breadcrumb"
              >
                {breadcrumbList.map((item, i) => {
                  return (<Link
                    underline="hover"
                    key={i + item.url}
                    color="inherit"
                    onClick={() => { navigate(item.url) }}
                  >{item.title}</Link>
                  )
                })}
              </Breadcrumbs>
            }
          </div>
          {buttonList && buttonList.length > 0 &&
            <div className="button-list-wrapper">
              {buttonList.map((item, i) => {
                return (
                  <>
                  {/* {item.url==="download-xlsx" && 
                      <a href={ProductTemplateFile} download="ProductTemplateFile" style={{'text-decoration':'none'}}  target='_blank'>
                        <Button key={i + item.text} variant={item.variant ? item.variant : "outlined"} onClick={(e) => { breadCrumButtonClickHandler(e, item) }}>{item.text}</Button>
                      </a>
                  } */}
                 {item.url!=="download-xlsx" && 
                    <>&nbsp;<Button key={i + item.text} variant={item.variant ? item.variant : "outlined"} onClick={(e) => { breadCrumButtonClickHandler(e, item) }}>{item.text}</Button></>
                  }
                 </>
                )
              })}
            </div>
          }
        </Box>
      </Stack>
    </>
  )
}

export default Breadcrumb;