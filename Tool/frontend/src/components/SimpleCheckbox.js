import cssStyle from "./SimpleCheckbox.module.css"

export default function SimpleCheckbox({checked, onChange}) {
    return (
        <input type="checkbox" checked={checked} onChange={onChange} className={cssStyle.baseStyle}/>
    );
}