import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormGroup,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Checkbox,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { showSnackbar } from '../../../redux/reducer/appSlice';
import {
  fetchHotelMealPlans,
  saveHotelMealPlan,
  deleteHotelMealPlan,
} from './HotelMealPlansApi';
import {
  MEAL_PLAN_CODE_OPTIONS,
  mealPlanCodeOption,
  dropdownLabel,
} from './mealPlanCodeOptions';

const emptyForm = () => ({
  hotelMealPlanId: '',
  name: '',
  code: '',
  category: 'STANDARD',
  includesBreakfast: false,
  includesLunch: false,
  includesDinner: false,
  pricePerPersonPerNight: '',
  isActive: true,
});

function inclusionChips(plan, t) {
  const chips = [];
  if (plan.includesBreakfast) chips.push(t('Breakfast'));
  if (plan.includesLunch) chips.push(t('Lunch'));
  if (plan.includesDinner) chips.push(t('Dinner'));
  if (chips.length === 0) chips.push(t('Room only'));
  return chips;
}

export default function HotelMealPlansSection({ hotelId }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadPlans = useCallback(() => {
    if (!hotelId) return;
    setLoading(true);
    fetchHotelMealPlans(hotelId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => {
        dispatch(showSnackbar({ type: 'error', message: e.message || t('Unable to load meal plans') }));
      })
      .finally(() => setLoading(false));
  }, [hotelId, dispatch, t]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const applyCodeDefaults = (code, prevForm, fillName = false) => {
    const opt = mealPlanCodeOption(code);
    if (!opt) return { ...prevForm, code };
    return {
      ...prevForm,
      code: opt.code,
      name: fillName || !prevForm.name?.trim() ? opt.defaultName : prevForm.name,
      includesBreakfast: opt.includesBreakfast,
      includesLunch: opt.includesLunch,
      includesDinner: opt.includesDinner,
    };
  };

  const openCreate = () => {
    setForm(applyCodeDefaults('CP', emptyForm(), true));
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      hotelMealPlanId: row.hotelMealPlanId || '',
      name: row.name || '',
      code: row.code || '',
      category: row.category || 'STANDARD',
      includesBreakfast: !!row.includesBreakfast,
      includesLunch: !!row.includesLunch,
      includesDinner: !!row.includesDinner,
      pricePerPersonPerNight:
        row.pricePerPersonPerNight != null ? String(row.pricePerPersonPerNight) : '',
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!form.name.trim()) {
      dispatch(showSnackbar({ type: 'error', message: t('Plan name is required') }));
      return;
    }
    setSaving(true);
    try {
      await saveHotelMealPlan(hotelId, {
        hotelMealPlanId: form.hotelMealPlanId || undefined,
        name: form.name.trim(),
        code: form.code.trim() || 'CP',
        category: form.category,
        includesBreakfast: form.includesBreakfast,
        includesLunch: form.includesLunch,
        includesDinner: form.includesDinner,
        pricePerPersonPerNight: Number(form.pricePerPersonPerNight) || 0,
        isActive: form.isActive,
      });
      dispatch(showSnackbar({ type: 'success', message: t('Meal plan saved') }));
      setDialogOpen(false);
      loadPlans();
    } catch (e) {
      const msg =
        e.response?.data ||
        (typeof e.response?.data === 'string' ? e.response.data : null) ||
        e.message ||
        t('Unable to save meal plan');
      dispatch(showSnackbar({ type: 'error', message: String(msg) }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (row.code === 'EP') {
      dispatch(showSnackbar({ type: 'error', message: t('Room-only plan cannot be deleted') }));
      return;
    }
    if (!window.confirm(t('Delete this meal plan?'))) return;
    try {
      await deleteHotelMealPlan(hotelId, row.hotelMealPlanId);
      dispatch(showSnackbar({ type: 'success', message: t('Meal plan removed') }));
      loadPlans();
    } catch (e) {
      const msg = e.response?.data || e.message || t('Unable to delete');
      dispatch(showSnackbar({ type: 'error', message: String(msg) }));
    }
  };

  if (!hotelId) return null;

  return (
    <div className="card-wrapper-default" style={{ marginTop: 20 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <div>
          <div className="title-header">{t('Meal plans')}</div>
          <Typography variant="body2" color="text.secondary">
            {t('Create the plans you offer (e.g. breakfast only, full board). Choose Standard (5% GST) or Luxury (18% GST) on meals.')}
          </Typography>
        </div>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('Add meal plan')}
        </Button>
      </Box>

      {loading ? (
        <Typography variant="body2">{t('Loading...')}</Typography>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          {t('No meal plans yet. Add one or use the default room-only plan after refresh.')}
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('Plan')}</TableCell>
                <TableCell>{t('Category')}</TableCell>
                <TableCell>{t('Inclusions')}</TableCell>
                <TableCell align="right">{t('₹ / guest / night')}</TableCell>
                <TableCell align="center">{t('Active')}</TableCell>
                <TableCell align="right">{t('Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.hotelMealPlanId}>
                  <TableCell>
                    <strong>{row.code}</strong> — {row.name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        row.category === 'LUXURY'
                          ? `${t('Luxury')} (${row.gstRatePercent || 18}% GST)`
                          : `${t('Standard')} (${row.gstRatePercent || 5}% GST)`
                      }
                      color={row.category === 'LUXURY' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {inclusionChips(row, t).map((c) => (
                      <Chip key={c} label={c} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell align="right">{row.pricePerPersonPerNight ?? 0}</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={row.isActive !== false ? t('Yes') : t('No')}
                      color={row.isActive !== false ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('Edit')}>
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {row.code !== 'EP' && (
                      <Tooltip title={t('Delete')}>
                        <IconButton size="small" color="error" onClick={() => handleDelete(row)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.hotelMealPlanId ? t('Edit meal plan') : t('Add meal plan')}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label={t('Plan name')}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('e.g. Breakfast only')}
          />
          <FormControl
            fullWidth
            margin="normal"
            disabled={form.code === 'EP' && !!form.hotelMealPlanId}
          >
            <InputLabel id="meal-plan-code-label">{t('Short code')}</InputLabel>
            <Select
              labelId="meal-plan-code-label"
              label={t('Short code')}
              value={form.code || 'CP'}
              onChange={(e) => {
                const code = e.target.value;
                setForm((f) => applyCodeDefaults(code, f, !f.name?.trim()));
              }}
            >
              {MEAL_PLAN_CODE_OPTIONS.map((opt) => (
                <MenuItem key={opt.code} value={opt.code}>
                  {dropdownLabel(opt, t)}
                </MenuItem>
              ))}
              {form.code &&
                !MEAL_PLAN_CODE_OPTIONS.some((o) => o.code === form.code) && (
                  <MenuItem value={form.code}>
                    {form.code} ({t('Custom')})
                  </MenuItem>
                )}
            </Select>
          </FormControl>
          <Box
            sx={{
              width: '100%',
              mt: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'stretch',
              gap: 0,
            }}
          >
            <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0, px: { sm: 1 } }}>
              <FormLabel component="legend">{t('Category (meal GST)')}</FormLabel>
              <RadioGroup
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <FormControlLabel
                  value="STANDARD"
                  control={<Radio />}
                  label={t('Standard — 5% GST')}
                  sx={{ display: 'flex', ml: 0, mb: 0.5 }}
                />
                <FormControlLabel
                  value="LUXURY"
                  control={<Radio />}
                  label={t('Luxury — 18% GST')}
                  sx={{ display: 'flex', ml: 0 }}
                />
              </RadioGroup>
            </FormControl>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' }, mx: 2 }}
            />
            <Divider sx={{ display: { xs: 'block', sm: 'none' }, my: 2 }} />

            <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0, px: { sm: 1 } }}>
              <FormLabel component="legend">{t('Inclusions')}</FormLabel>
              <FormGroup sx={{ alignItems: 'flex-start' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.includesBreakfast}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, includesBreakfast: e.target.checked }))
                      }
                    />
                  }
                  label={t('Breakfast')}
                  sx={{ display: 'flex', ml: 0, mb: 0.5 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.includesLunch}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, includesLunch: e.target.checked }))
                      }
                    />
                  }
                  label={t('Lunch')}
                  sx={{ display: 'flex', ml: 0, mb: 0.5 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.includesDinner}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, includesDinner: e.target.checked }))
                      }
                    />
                  }
                  label={t('Dinner')}
                  sx={{ display: 'flex', ml: 0 }}
                />
              </FormGroup>
            </FormControl>
          </Box>
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label={t('Price per guest per night (₹)')}
            inputProps={{ min: 0, step: 1 }}
            value={form.pricePerPersonPerNight}
            onChange={(e) => setForm((f) => ({ ...f, pricePerPersonPerNight: e.target.value }))}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
            }
            label={t('Active for bookings')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            {t('Cancel')}
          </Button>
          <Button variant="contained" onClick={handleSavePlan} disabled={saving}>
            {saving ? t('Saving...') : t('Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
