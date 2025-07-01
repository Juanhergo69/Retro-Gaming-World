import { useContext } from 'react'
import { ModalContext } from '../contexts/ModalContext'

function Modal() {
    const { modal, hideModal } = useContext(ModalContext)

    if (!modal.isOpen) return null

    const handleConfirm = () => {
        if (modal.onConfirm) {
            modal.onConfirm()
        } else {
            hideModal()
        }
    }

    const handleCancel = () => {
        if (modal.onCancel) {
            modal.onCancel()
        } else {
            hideModal()
        }
    }

    const hasCustomCancel = modal.onCancel && modal.onCancel.toString() !== '() => {hideModal()}'

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-retro p-6 max-w-md w-full">
                <h3 className="text-xl font-retro text-retro-purple mb-4">
                    {modal.title}
                </h3>
                <p className="text-gray-700 mb-6">{modal.message}</p>
                <div className="flex justify-end space-x-4">
                    {hasCustomCancel && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-retro-purple text-white rounded hover:bg-retro-pink transition"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Modal