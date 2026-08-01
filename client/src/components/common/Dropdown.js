import React from 'react';
import Select from 'react-select';
import { useTheme } from '@material-ui/core/styles';

// react-select wrapper that renders its menu in a body-level portal
// so table headers / sticky elements never overlap the dropdown.
export default function Dropdown(props) {
    const { styles, ...rest } = props;
    const theme = useTheme();
    const dark = theme.palette.type === 'dark';
    const apply = (key, base, state) => {
        const custom = styles && styles[key];
        return typeof custom === 'function' ? custom(base, state) : base;
    };

    const themedStyles = {
        container: (base, state) => apply('container', base, state),
        control: (base, state) => ({
            ...apply('control', base, state),
            backgroundColor: theme.palette.background.paper,
            borderColor: state.isFocused ? theme.palette.primary.main : theme.palette.divider,
            color: theme.palette.text.primary,
            boxShadow: state.isFocused ? `0 0 0 1px ${theme.palette.primary.main}` : 'none',
            '&:hover': { borderColor: theme.palette.primary.main },
        }),
        valueContainer: (base, state) => apply('valueContainer', base, state),
        input: (base, state) => ({ ...apply('input', base, state), color: theme.palette.text.primary }),
        singleValue: (base, state) => ({ ...apply('singleValue', base, state), color: theme.palette.text.primary }),
        placeholder: (base, state) => ({ ...apply('placeholder', base, state), color: theme.palette.text.secondary }),
        indicatorsContainer: (base, state) => apply('indicatorsContainer', base, state),
        dropdownIndicator: (base, state) => ({ ...apply('dropdownIndicator', base, state), color: theme.palette.text.secondary }),
        clearIndicator: (base, state) => ({ ...apply('clearIndicator', base, state), color: theme.palette.text.secondary }),
        indicatorSeparator: (base, state) => ({ ...apply('indicatorSeparator', base, state), backgroundColor: theme.palette.divider }),
        menuPortal: (base, state) => ({ ...apply('menuPortal', base, state), zIndex: 9999 }),
        menu: (base, state) => ({
            ...apply('menu', base, state), zIndex: 9999,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: dark ? '0 12px 28px rgba(0,0,0,.45)' : base.boxShadow,
        }),
        menuList: (base, state) => ({ ...apply('menuList', base, state), backgroundColor: theme.palette.background.paper }),
        option: (base, state) => ({
            ...apply('option', base, state),
            color: state.isSelected ? theme.palette.primary.contrastText : theme.palette.text.primary,
            backgroundColor: state.isSelected
                ? theme.palette.primary.main
                : state.isFocused ? theme.palette.action.hover : theme.palette.background.paper,
            cursor: 'pointer',
        }),
        noOptionsMessage: (base, state) => ({ ...apply('noOptionsMessage', base, state), color: theme.palette.text.secondary }),
        multiValue: (base, state) => ({ ...apply('multiValue', base, state), backgroundColor: dark ? '#334155' : '#E8EDFF' }),
        multiValueLabel: (base, state) => ({ ...apply('multiValueLabel', base, state), color: theme.palette.text.primary }),
        multiValueRemove: (base, state) => ({
            ...apply('multiValueRemove', base, state), color: theme.palette.text.secondary,
            '&:hover': { backgroundColor: theme.palette.error.main, color: theme.palette.error.contrastText },
        }),
    };
    return (
        <Select
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
            styles={themedStyles}
            {...rest}
        />
    );
}
