import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Consulta from "./pages/Consulta";
import Tribunais from "./pages/Tribunais";
import { Privacidade, Termos, Aviso, Sobre, OpenSource } from "./pages/Legal";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/tribunais" element={<Tribunais />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/aviso" element={<Aviso />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/open-source" element={<OpenSource />} />
      </Routes>
    </BrowserRouter>
  );
}
