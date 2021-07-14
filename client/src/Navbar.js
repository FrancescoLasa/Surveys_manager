import { Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";


import { iconGraph, iconPerson, iconLogOut, iconCreateSurvey } from './icons.js';


function NavbarCst({loggedIn, setFlagDirty, doLogOut}) {

    return <Navbar bg="success" expand="sm" variant="dark" className="justify-content-between" style={{ 'padding': 8 }}>
        <Navbar.Brand>
            <Link style={{ textDecoration: 'none', color: 'white' }} to={{ pathname: "/" }} onClick={()=>setFlagDirty((flag)=>!flag)}>
                {iconGraph}
                {" Survey collector"}
            </Link>
        </Navbar.Brand>
        {loggedIn ?
            <>
                <Link style={{ textDecoration: 'none', color: 'white' }} to={{ pathname: "/create" }}>{"Create "}{iconCreateSurvey}</Link>
                <Link style={{ textDecoration: 'none', color: 'white' }} to={{ pathname: "/login" }} onClick={()=>doLogOut(false)}>{iconLogOut}</Link>
            </>
            :
            <Link style={{ textDecoration: 'none', color: 'white' }} to={{ pathname: "/login" }}>{iconPerson}</Link>
        }

    </Navbar>
}


export { NavbarCst }