import React from 'react';

const PanelDropdown = (props) => {
    const BUSINESS_NAME = localStorage.getItem("businessName");

    return (
        <div className="panel-dropdown-section">
            <strong>{`Hotel Booking Engine`}</strong>
        </div>
    )
}

export default PanelDropdown;