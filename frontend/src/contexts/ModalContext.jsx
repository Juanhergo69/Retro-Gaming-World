import { createContext, useContext, useState } from 'react'

export const ModalContext = createContext()

export function ModalProvider({ children }) {
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
    })

    const showModal = (title, message, onConfirm = null, onCancel = null) => {
        setModal({
            isOpen: true,
            title,
            message,
            onConfirm: onConfirm
                ? () => {
                    onConfirm()
                    setModal(prev => ({ ...prev, isOpen: false }))
                }
                : () => setModal(prev => ({ ...prev, isOpen: false })),
            onCancel: onCancel
                ? () => {
                    onCancel()
                    setModal(prev => ({ ...prev, isOpen: false }))
                }
                : () => setModal(prev => ({ ...prev, isOpen: false }))
        })
    }

    const hideModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }))
    }

    return (
        <ModalContext.Provider value={{ modal, showModal, hideModal }}>
            {children}
        </ModalContext.Provider>
    )
}

export function useModal() {
    return useContext(ModalContext)
}