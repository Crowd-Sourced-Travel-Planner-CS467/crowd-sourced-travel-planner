import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
    const navigate = useNavigate();

    return (
        <nav className="navbar">
            <div
                className="navbar-title"
                onClick={() => navigate("/")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate("/");
                    }
                }}
            >
                Crowd-Sourced Travel Planner
            </div>
        </nav>
    );
}

export default Navbar;
