import Header from "./components/header";
import Sidebar from "./components/sidebar";

export default function GuruLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName="Braum Chad" userRole="guru" />
      <Sidebar />
      <main className="ml-64 mt-16 p-6">{children}</main>
    </div>
  );
}