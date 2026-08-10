import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminTopbar.css";

export default function AdminTopbar({ onToggle }){

    const {currentUser,logout}=useAuth();

    const navigate=useNavigate();

    async function handleLogout(){

        await logout();

        navigate("/admin/login");

    }

    return(

        <header className="topbar">

            <div className="topbar-left">

                <button
                    type="button"
                    className="menu-btn"
                    onClick={onToggle}
                    aria-label="Toggle admin navigation"
                >
                    ☰
                </button>

                <div>

                    Welcome,

                    <strong>

                        {currentUser?.email}

                    </strong>

                </div>

            </div>

            <button onClick={handleLogout}>

                Logout

            </button>

        </header>

    )

}
