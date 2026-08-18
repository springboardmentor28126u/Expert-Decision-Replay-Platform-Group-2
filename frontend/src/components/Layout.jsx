import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        style={{
          marginLeft: "260px",
          width: "calc(100% - 260px)",
          minHeight: "100vh",
          background: "#f8fafc",
        }}
      >
        <Navbar />

        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;
