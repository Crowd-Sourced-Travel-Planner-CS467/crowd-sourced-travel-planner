{/*
The code for having a page open from the top was generated with the help of ChatGPT.
These transcript links https://chatgpt.com/share/6b06539d-c100-83e8-a675-b295a8079010
document the GenAI interaction that led the code in ScrollToTop.jsx
*/}

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
    const { pathname } = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    return null
}