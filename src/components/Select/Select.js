
import { default as SelectMUI } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import './Select.scss';
// import FormControl from '@mui/material/FormControl';

const Select = (props) => {
  const { selectedOption, onChange, id, label, placeholder, options } = props;
  return (
    <div className="form-field legacy-app-select">
      <span>{label}</span>
      <SelectMUI
        className="select-input-field"
        labelId={id}
        id={id}
        value={selectedOption.value}
        onChange={onChange}
        displayEmpty={true}
        renderValue={option => {
          if (option) {
            if (Array.isArray(option)) {
              let selectedOptionList = [];
              return option.forEach(el => selectedOptionList.push(el.value));
            } else {
              let item = options.find(el => el.value === option);
              return item.label;
            }
          } else {
            return placeholder
          }
        }}
        IconComponent={() => <KeyboardArrowDownIcon sx={{ color: "#0000008a", marginRight: "5px" }} />}
      >
        {options && options.length > 0 && options.map((el, i) => {
          return (
            <MenuItem
              key={el.value + i}
              value={el.value}
            >
              {el.label}
            </MenuItem>)
        })}
      </SelectMUI>
    </div>
  )
}

export default Select;
