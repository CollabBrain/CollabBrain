import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router';
import './index.css';

function App() {
  return (
    // AppProviders chứa QueryClientProvider
    <AppProviders>
      {/* BrowserRouter phải bên trong AppProviders để hooks có thể useNavigate */}
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
