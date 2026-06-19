export const getPlanId = (plan) =>
  plan?.mealPlanId || plan?.hotelMealPlanId || null;

export const mealPlanCardKey = (roomDocId, mealPlanId) => `${roomDocId}:${mealPlanId}`;

export const mealPlanRateTitle = (plan) => {
  if (!plan) return 'Standard rate';
  const code = (plan.code || '').toUpperCase();
  if (code === 'EP') return 'Room only';
  if (code === 'CP') return 'With breakfast';
  if (code === 'MAP') return 'Breakfast & dinner';
  if (code === 'AP') return 'All meals included';
  return plan.name || code || 'Meal plan';
};

export const distributeGuestsAcrossRooms = (room, quantity, totalGuests) => {
  const qty = Math.max(0, Number(quantity) || 0);
  const base = Math.max(1, Number(room.noOfPersons) || 1);
  const maxExtra = room.allowExtraPerson ? Math.max(0, Number(room.maxExtraPersons) || 0) : 0;
  let remaining = Math.max(0, Number(totalGuests) || 0);
  const instances = [];
  for (let i = 0; i < qty; i += 1) {
    if (remaining > 0) {
      const take = Math.min(remaining, base + maxExtra);
      const extra = Math.max(0, take - base);
      instances.push({ extraPersons: extra, guests: take });
      remaining -= take;
    } else {
      instances.push({ extraPersons: 0, guests: 0 });
    }
  }
  return instances;
};

export const selectedQuantityForRoomId = (cartLines, roomDocId) =>
  (cartLines || [])
    .filter((l) => l.id === roomDocId)
    .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

export const quantityForPlanOnRoom = (cartLines, roomDocId, planId) =>
  (cartLines || []).reduce((sum, line) => {
    const linePlanId = getPlanId(line.mealPlan) ?? line.mealPlanId ?? null;
    if (line.id !== roomDocId || linePlanId !== (planId ?? null)) return sum;
    return sum + (Number(line.quantity) || 0);
  }, 0);

export const buildCartLine = (room, plan, quantity, instances, slotIndex = 0) => {
  const mpId = getPlanId(plan);
  return {
    ...room,
    cardKey: mealPlanLineKey(room.id, mpId, slotIndex),
    mealPlanId: mpId,
    mealPlan: plan,
    mealPlanCode: plan?.code,
    mealPlanName: plan?.name,
    quantity,
    instances,
  };
};

export const mealPlanLineKey = (roomDocId, mealPlanId, slotIndex = 0) => {
  const base = mealPlanCardKey(roomDocId, mealPlanId);
  return slotIndex > 0 ? `${base}:s${slotIndex}` : base;
};

export const totalCartRooms = (cartLines) =>
  (cartLines || []).reduce((s, l) => s + (Number(l.quantity) || 0), 0);

export const totalCartGuests = (cartLines) =>
  (cartLines || []).reduce((sum, line) => {
    const instances = line.instances || [];
    return (
      sum +
      instances.reduce((s, inst) => {
        const base = Math.max(1, Number(line.noOfPersons) || 1);
        const extra = Number(inst?.extraPersons) || 0;
        if (inst?.guests != null) {
          const guests = Math.max(0, Number(inst.guests) || 0);
          return s + (guests >= base + extra ? guests : guests + extra);
        }
        return s + base + extra;
      }, 0)
    );
  }, 0);

/** Merge plan quantities into cart lines for one room type (website split-rate pattern). */
export const applySplitRateToCart = (cartLines, room, planQuantities, totalGuests) => {
  const entries = (planQuantities || []).filter((e) => e?.plan && (Number(e.qty) || 0) > 0);
  const totalQty = entries.reduce((sum, e) => sum + (Number(e.qty) || 0), 0);
  const others = (cartLines || []).filter((l) => l.id !== room.id);
  if (totalQty <= 0) {
    return others;
  }
  const instancesAll = distributeGuestsAcrossRooms(room, totalQty, totalGuests);
  let offset = 0;
  const newLines = entries.map(({ plan, qty }, slotIndex) => {
    const count = Number(qty) || 0;
    const slice = instancesAll.slice(offset, offset + count);
    offset += count;
    return buildCartLine(room, plan, count, slice, slotIndex);
  });
  return [...others, ...newLines];
};

export const adjustExtraPersonOnLine = (cartLines, cardKey, delta) => {
  return (cartLines || []).map((line) => {
    if (line.cardKey !== cardKey) return line;
    const totalMaxExtra = line.quantity * (Number(line.maxExtraPersons) || 0);
    const currentTotalExtra = (line.instances || []).reduce(
      (s, i) => s + (Number(i.extraPersons) || 0),
      0
    );
    let newTotal = currentTotalExtra + delta;
    if (newTotal < 0) newTotal = 0;
    if (newTotal > totalMaxExtra) newTotal = totalMaxExtra;
    let remaining = newTotal;
    const newInstances = (line.instances || []).map((inst) => {
      const take = Math.min(remaining, Number(line.maxExtraPersons) || 0);
      remaining -= take;
      const assignedGuests =
        inst?.guests != null
          ? Math.max(0, Number(inst.guests) || 0)
          : Number(line.noOfPersons) || 1;
      return { extraPersons: take, guests: assignedGuests };
    });
    return { ...line, instances: newInstances };
  });
};
