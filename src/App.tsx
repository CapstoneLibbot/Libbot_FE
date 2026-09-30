import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './app/providers/AppProvider';
import { AppRouter } from './app/router/AppRouter';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProvider>
  );
}
//test
