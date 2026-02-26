import Header from "./components/header";
import Sidebar from "./components/sidebar";

export default function TeacherLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="ml-64 mt-16 p-6">{children}</main>
    </div>
  );
}