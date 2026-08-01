import React from 'react';
import { Avatar } from '@material-ui/core';

const initials = (name = '') => name.split(/[ ,]+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();

function EmployeeAvatar({ image, name, size = 40, style = {} }) {
    return (
        <Avatar src={image || undefined} alt={name || 'Employee'} style={{ width: size, height: size, fontSize: Math.max(12, size * 0.35), ...style }}>
            {initials(name)}
        </Avatar>
    );
}

export default EmployeeAvatar;
