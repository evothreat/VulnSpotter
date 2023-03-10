import checkboxCss from "./SimpleCheckbox.module.css"

export default function SimpleCheckbox({checked, onChange}) {
    return (
        <input type="checkbox" checked={checked} onChange={onChange} className={checkboxCss.baseStyle}/>
    );
}