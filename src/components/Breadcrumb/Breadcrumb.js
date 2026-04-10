import React from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Stack from '@mui/material/Stack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import './Breadcrumb.scss';

function Breadcrumb({
  pageTitle,
  buttonList = [],
  breadcrumbList = [],
  breadCrumButtonClickHandler,
  rmMargin,
  className,
  hideBreadcrumb = false,
}) {
  const navigate = useNavigate();
  const crumbs = hideBreadcrumb ? [] : breadcrumbList;
  const showCrumbs = Array.isArray(crumbs) && crumbs.length > 0;
  const showTitleRow = Boolean(pageTitle) || (Array.isArray(buttonList) && buttonList.length > 0);

  return (
    <>
      <Stack spacing={0}>
        <Box
          component="div"
          className={`breadcrumb-wrapper${className ? ` ${className}` : ''}`}
          sx={{ marginBottom: rmMargin ? 0 : '15px' }}
        >
          <Box className="breadcrumb-inner">
            {showCrumbs ? (
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" className="navigator" />}
                aria-label="breadcrumb"
                className="breadcrumb breadcrumb--above-title"
              >
                {crumbs.map((item, i) => {
                  return (
                    <Link
                      underline="hover"
                      key={i + item.url}
                      color="inherit"
                      onClick={() => {
                        navigate(item.url);
                      }}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </Breadcrumbs>
            ) : null}
            {showTitleRow ? (
              <Box
                className={`breadcrumb-title-actions${
                  pageTitle ? '' : ' breadcrumb-title-actions--actions-only'
                }`}
              >
                {pageTitle ? <h2 className="page-title">{pageTitle}</h2> : null}
                {buttonList && buttonList.length > 0 ? (
                  <div className="button-list-wrapper">
                    {buttonList.map((item, i) => {
                      if (item.url === 'download-xlsx') return null;
                      return (
                        <Button
                          key={`${item.url}-${i}`}
                          variant={item.variant ? item.variant : 'outlined'}
                          size="medium"
                          onClick={(e) => {
                            if (typeof breadCrumButtonClickHandler === 'function') {
                              breadCrumButtonClickHandler(e, item);
                            }
                          }}
                        >
                          {item.text}
                        </Button>
                      );
                    })}
                  </div>
                ) : null}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Stack>
    </>
  );
}

export default Breadcrumb;