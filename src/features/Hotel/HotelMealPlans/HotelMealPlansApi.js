import { axiosPrService } from '../../../axios/axiosInstance';

export const fetchHotelMealPlans = (hotelId) =>
  axiosPrService.get(`/hotel/${hotelId}/meal-plans`).then((res) => res.data);

export const saveHotelMealPlans = (hotelId, plans) =>
  axiosPrService.post(`/hotel/${hotelId}/meal-plans`, { plans }).then((res) => res.data);

export const saveHotelMealPlan = (hotelId, plan) =>
  axiosPrService.post(`/hotel/${hotelId}/meal-plans/plan`, plan).then((res) => res.data);

export const deleteHotelMealPlan = (hotelId, hotelMealPlanId) =>
  axiosPrService.delete(`/hotel/${hotelId}/meal-plans/${hotelMealPlanId}`).then((res) => res.data);

export const fetchHotelMealPlansActive = (hotelId) =>
  axiosPrService.get(`/hotel/${hotelId}/meal-plans/active`).then((res) => res.data);
