
import { Link } from "react-router-dom";
import "../../styles/navbar.css";
function Navbar({ user }) {

    return (

        <header className="navbar">

            <div>

                <input 
                    type="text"
                    placeholder="Search decisions..."
                />

            </div>


            <div className="profile">

                <span>
                    🔔
                </span>


                <span>
                    {user.name}
                </span>


                <span>
                    ({user.role})
                </span>

            </div>


        </header>

    );

}

export default Navbar;