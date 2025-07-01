function Checkbox({ name, checked, onChange, label, ...props }) {
    return (
        <div className="flex items-center">
            <input
                id={name}
                name={name}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-4 w-4 text-retro-purple focus:ring-retro-purple border-gray-300 rounded"
                {...props}
            />
            <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
                {label}
            </label>
        </div>
    )
}

export default Checkbox