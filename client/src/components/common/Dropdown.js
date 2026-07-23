import React from 'react';
import Select from 'react-select';

// react-select wrapper that renders its menu in a body-level portal
// so table headers / sticky elements never overlap the dropdown.
export default function Dropdown(props) {
    const { styles, ...rest } = props;
    return (
        <Select
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
                ...(styles || {}),
            }}
            {...rest}
        />
    );
}
