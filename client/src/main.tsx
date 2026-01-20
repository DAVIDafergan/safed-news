// main.tsx
import { AuthProvider } from './context/AuthContext.tsx' // וודא נתיב נכון

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* הוספה כאן */}
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)