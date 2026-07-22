import { FaBell, FaUserCircle } from "react-icons/fa";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm px-4 py-3">

      <h4 className="fw-bold text-primary m-0">
        Expert Decision Replay Platform
      </h4>

      <div className="ms-auto d-flex align-items-center">

        <button className="btn btn-light position-relative me-3">

          <FaBell size={20} />

          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          >
            3
          </span>

        </button>

        <FaUserCircle
          size={38}
          className="text-primary me-2"
        />

        <div>

          <div className="fw-bold">
            Welcome
          </div>

          <small className="text-muted">
            Expert User
          </small>

        </div>

      </div>

    </nav>
  );
}

export default Navbar;