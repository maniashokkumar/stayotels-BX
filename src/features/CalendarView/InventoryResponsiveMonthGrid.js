import React, { useMemo } from "react";
import Tippy from "@tippy.js/react";
import InfoIcon from "@mui/icons-material/Info";

function pad2(n) {
    return String(n).padStart(2, "0");
}

export function toIsoDateLocal(year, monthIndex, day) {
    return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function InventoryDayStats({ totalRooms, bookedRooms, availableRooms, lockedRooms, t }) {
    const isFullyBooked = availableRooms === 0;
    const containerStyle = {
        backgroundColor: isFullyBooked ? "#e53935" : bookedRooms > 0 ? "#f57c00" : "#2b60e0",
        color: "white",
        borderRadius: "4px",
        lineHeight: "1.25",
        width: "100%",
    };

    return (
        <div className="inventory-day-stats inventory-day-stats--stack" style={containerStyle}>
            <div className="inventory-day-stats__row inventory-day-stats__row--total inventory-day-stats__row--statline">
                {t("Total")}: {totalRooms}
            </div>
            <div className="inventory-day-stats__row inventory-day-stats__row--statline">
                <span className="inventory-day-stats__label-caps">{t("Booked")}:</span>
                <span className="inventory-day-stats__value"> {bookedRooms}</span>
            </div>
            <div className="inventory-day-stats__row inventory-day-stats__row--statline">
                <span className="inventory-day-stats__label-caps">{t("Available")}:</span>
                <span className="inventory-day-stats__value"> {availableRooms}</span>
            </div>
            {lockedRooms > 0 && (
                <div className="inventory-day-stats__row inventory-day-stats__row--locked inventory-day-stats__row--statline">
                    <span className="inventory-day-stats__label-caps inventory-day-stats__label-caps--locked-mixed">{t("Locked (Booking in progress)")}</span>
                    <span className="inventory-day-stats__value"> {lockedRooms}</span>
                    <Tippy content={t("Rooms held for pending payments (may free up in 8 mins)")} delay={[100, 0]} arrow={true}>
                        <span className="inventory-day-stats__lock-tip">
                            <InfoIcon className="inventory-day-stats__info-icon" style={{ cursor: "help", color: "#ffd700" }} />
                        </span>
                    </Tippy>
                </div>
            )}
        </div>
    );
}

/**
 * Month view: responsive grid; header "3 (SUNDAY)" — localized long weekday, uppercased.
 */
export default function InventoryResponsiveMonthGrid({
    year,
    monthIndex,
    inventoryByDate,
    locale,
    t,
    onDayClick,
}) {
    const days = useMemo(() => {
        const last = new Date(year, monthIndex + 1, 0).getDate();
        const loc = locale || "en";
        const out = [];
        for (let d = 1; d <= last; d += 1) {
            const dateStr = toIsoDateLocal(year, monthIndex, d);
            const dt = new Date(year, monthIndex, d);
            const weekday = dt.toLocaleDateString(loc, { weekday: "long" });
            out.push({
                day: d,
                dateStr,
                weekdayLabel: weekday.toLocaleUpperCase(loc),
            });
        }
        return out;
    }, [year, monthIndex, locale]);

    return (
        <div className="inventory-responsive-month" role="list">
            {days.map(({ day, dateStr, weekdayLabel }) => {
                const row = inventoryByDate.get(dateStr);
                const hasData = row != null;

                return (
                    <div
                        key={dateStr}
                        className="inventory-day-cell"
                        role="listitem"
                        tabIndex={0}
                        onClick={() => onDayClick(dateStr)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onDayClick(dateStr);
                            }
                        }}
                    >
                        <div className="inventory-day-cell__header">
                            {day} ({weekdayLabel})
                        </div>
                        {hasData ? (
                            <InventoryDayStats
                                totalRooms={row.totalRooms}
                                bookedRooms={row.bookedRooms}
                                availableRooms={row.availableRooms}
                                lockedRooms={row.lockedRooms || 0}
                                t={t}
                            />
                        ) : (
                            <div className="inventory-day-cell__empty">{t("No data")}</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
