import React, { useMemo } from 'react';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useTranslation } from 'react-i18next';
import {
  applySplitRateToCart,
  adjustExtraPersonOnLine,
  getPlanId,
  mealPlanRateTitle,
  quantityForPlanOnRoom,
  selectedQuantityForRoomId,
} from '../../../Utils/cpMealPlanUtils';

function PlanQtyRow({ plan, qty, maxRooms, roomQty, onChange }) {
  const { t } = useTranslation();
  const atMax = roomQty >= maxRooms;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        py: 0.75,
        px: 1,
        border: '1px solid',
        borderColor: qty > 0 ? 'primary.main' : 'divider',
        borderRadius: 1,
        mb: 0.75,
      }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {mealPlanRateTitle(plan)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ₹{Number(plan.pricePerPersonPerNight) || 0} / {t('guest')} / {t('night')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          size="small"
          disabled={qty <= 0}
          onClick={() => onChange(Math.max(0, qty - 1))}
          aria-label={t('Decrease')}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
          {qty}
        </Typography>
        <IconButton
          size="small"
          disabled={atMax}
          onClick={() => onChange(qty + 1)}
          aria-label={t('Increase')}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

export default function CpRoomCartPanel({
  availableRooms,
  mealPlans,
  cartLines,
  onCartChange,
  totalGuests,
}) {
  const { t } = useTranslation();

  const plans = useMemo(() => {
    if (Array.isArray(mealPlans) && mealPlans.length > 0) return mealPlans;
    return [
      {
        code: 'EP',
        name: 'Room only',
        mealPlanId: null,
        pricePerPersonPerNight: 0,
      },
    ];
  }, [mealPlans]);

  const rooms = useMemo(
    () =>
      (availableRooms || []).map((r) => ({
        ...r,
        id: r.id || r._id,
        totolNoRooms: Number(r.totolNoRooms ?? r.totalNoRooms ?? 0),
        noOfPersons: Number(r.noOfPersons) || 2,
        allowExtraPerson: r.allowExtraPerson === true || r.allowExtraPerson === 'true',
        maxExtraPersons: Number(r.maxExtraPersons) || 0,
        extraPersonCharge: Number(r.extraPersonCharge) || 0,
      })),
    [availableRooms]
  );

  const handlePlanQty = (room, plan, nextQty) => {
    const maxRooms = room.totolNoRooms || 0;
    const currentRoomQty = selectedQuantityForRoomId(cartLines, room.id);
    const currentPlanQty = quantityForPlanOnRoom(cartLines, room.id, getPlanId(plan));
    const otherPlansQty = currentRoomQty - currentPlanQty;
    let qty = Math.max(0, nextQty);
    if (otherPlansQty + qty > maxRooms) {
      qty = Math.max(0, maxRooms - otherPlansQty);
    }
    const planQuantities = plans.map((p) => ({
      plan: p,
      qty: getPlanId(p) === getPlanId(plan) ? qty : quantityForPlanOnRoom(cartLines, room.id, getPlanId(p)),
    }));
    onCartChange(applySplitRateToCart(cartLines, room, planQuantities, totalGuests));
  };

  if (!rooms.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('Select hotel and dates to load rooms.')}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {rooms.map((room) => {
        const roomQty = selectedQuantityForRoomId(cartLines, room.id);
        const maxRooms = room.totolNoRooms || 0;
        const roomLines = (cartLines || []).filter((l) => l.id === room.id && l.quantity > 0);

        return (
          <Box
            key={room.id || room.roomId}
            sx={{
              mb: 2.5,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {room.roomName}
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {t('Up to')} {room.noOfPersons} {t('guests')}
                {room.allowExtraPerson
                  ? ` · ${t('Extra')} ₹${room.extraPersonCharge}/${t('night')}`
                  : ''}
              </Typography>
            </Typography>

            {plans.map((plan) => (
              <PlanQtyRow
                key={getPlanId(plan) || plan.code}
                plan={plan}
                qty={quantityForPlanOnRoom(cartLines, room.id, getPlanId(plan))}
                maxRooms={maxRooms}
                roomQty={roomQty}
                onChange={(q) => handlePlanQty(room, plan, q)}
              />
            ))}

            {roomLines.map((line) => {
              const totalExtra = (line.instances || []).reduce(
                (s, i) => s + (Number(i.extraPersons) || 0),
                0
              );
              if (!line.allowExtraPerson) return null;
              return (
                <Box
                  key={line.cardKey}
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {mealPlanRateTitle(line.mealPlan)} — {t('Extra persons')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      ₹{line.extraPersonCharge} {t('per person/night')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      disabled={totalExtra <= 0}
                      onClick={() =>
                        onCartChange(adjustExtraPersonOnLine(cartLines, line.cardKey, -1))
                      }
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2">{totalExtra}</Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        onCartChange(adjustExtraPersonOnLine(cartLines, line.cardKey, 1))
                      }
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
