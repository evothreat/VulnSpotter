
const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    mt: '50px',
    mb: '30px',
    '& button': {
        textTransform: 'none',
        fontSize: '14px'
    }
};

const actionBtnStyle = {
    fontSize: '22px',
    padding: '4px 4px',
    color: '#707070'
};

const newMsgBadgeStyle = {
    "& .MuiBadge-badge": {
        backgroundColor: '#eb0014',
    }
}

export {
    headerStyle,
    actionBtnStyle,
    newMsgBadgeStyle
};