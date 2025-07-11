import { useState } from 'react'

function AvatarEditor({ currentAvatar, username, onChange, onRemove }) {
    const [preview, setPreview] = useState(currentAvatar)
    const [isEditing, setIsEditing] = useState(false)

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result)
            onChange(reader.result)
            setIsEditing(false)
        }
        reader.readAsDataURL(file)
    }

    const handleRemove = () => {
        setPreview(null)
        onRemove()
    }

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                {preview ? (
                    <img
                        src={preview}
                        alt="User avatar"
                        className="w-32 h-32 rounded-full object-cover border-4 border-retro-purple"
                    />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-retro-yellow flex items-center justify-center border-4 border-retro-purple">
                        <span className="text-4xl font-bold text-retro-dark">
                            {username?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {!isEditing ? (
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-retro-blue text-white rounded hover:bg-retro-purple transition"
                    >
                        Change Avatar
                    </button>
                    {preview && (
                        <button
                            onClick={handleRemove}
                            className="px-4 py-2 bg-retro-pink text-white rounded hover:bg-red-600 transition"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-2">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="avatar-upload"
                    />
                    <label
                        htmlFor="avatar-upload"
                        className="px-4 py-2 bg-retro-green text-white rounded hover:bg-green-600 transition cursor-pointer"
                    >
                        Choose Image
                    </label>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}

export default AvatarEditor