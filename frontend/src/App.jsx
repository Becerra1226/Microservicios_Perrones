import { useState } from 'react';
import Login from './components/Login';
import Productos from './components/Productos';
import Ordenes from './components/Ordenes';
import { ShieldCheck, LogOut } from 'lucide-react';

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    const usuarioGuardado = localStorage.getItem('usuario_perrones');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const manejarLogin = (datosUsuario) => {
    setUsuarioLogueado(datosUsuario);
    localStorage.setItem('usuario_perrones', JSON.stringify(datosUsuario));
  };

  const manejarLogout = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem('usuario_perrones');
  };

  if (!usuarioLogueado) {
    return <Login onLoginSuccess={manejarLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-slate-950" />
          Perrones <span className="text-sm font-normal text-slate-400">| Admin</span>
        </h1>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <span className="font-medium text-slate-900">Hola, {usuarioLogueado.nombre || 'Usuario'}</span>
          <button 
            onClick={manejarLogout} 
            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      {/* 2. Reemplazamos todo el contenido por nuestro componente Productos */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        <Ordenes/>
      </main>
    </div>
  );
}

export default App;