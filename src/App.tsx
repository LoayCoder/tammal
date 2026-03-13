import { AppProviders } from "@/app/providers";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "@/routes";

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </AppProviders>
);

export default App;
