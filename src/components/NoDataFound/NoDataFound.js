import React from 'react'
import { useTranslation } from 'react-i18next';

function NoDataFound({ color, text }) {
  const { t } = useTranslation();
  if (!color) {
    color = "#9e9e9e"
  }
  return (
    <div className="noDataFound-wrapper">
      <p className="lead-noData" style={{ color: color }}> {t(text + "")} </p>
    </div>
  )
}

export default NoDataFound;
