import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminTopbar.css";

export default function AdminTopbar(){

    const {currentUser,logout}=useAuth();

    const navigate=useNavigate();

    async function handleLogout(){

        await logout();

        navigate("/admin/login");

    }

    return(

        <header className="topbar">

            <div>

                Welcome,

                <strong>

                    {currentUser?.email}

                </strong>

            </div>

            <button onClick={handleLogout}>

                Logout

            </button>

        </header>

    )

}