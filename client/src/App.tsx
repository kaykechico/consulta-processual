import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Consulta from "./pages/Consulta";
import { Privacidade, Termos, Aviso } from "./pages/Legal";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/aviso" element={<Aviso />} />
      </Routes>
    </BrowserRouter>
  );
}
