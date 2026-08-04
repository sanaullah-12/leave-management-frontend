import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import './index.css'
// Initialises i18next. `i18nReady` resolves once the detector has settled on a
// language and the shell namespaces are in memory, so the app never paints in
// the wrong language and then snaps. The awaited chunks are sub-kilobyte.
import { i18nReady } from './i18n'
import './styles/rtl.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

const render = () =>
  root.render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  )

// `i18nReady` never rejects (it swallows its own errors), but render
// unconditionally so a future change there can't leave a blank page.
void i18nReady.then(render, render)
