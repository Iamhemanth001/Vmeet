import React from 'react'
import { Link } from 'react-router-dom'

export default function landing() {
  return (
    <div className='landingPageContainer'>
        <nav>
            <div className='navHeader'>
                <h2>Vmeet</h2>
            </div>

            <div className='navList'>
                <p>Join as Guest</p>
                <p>Register</p>
                <div role='button'>
                    <p>Login</p>
                </div>
            </div>
        </nav>

        <div className="landingMainContainer">
            <div>
                <img src="/moblie.png" alt="moblie"/>
            </div>

            <div>
                <h2>Vmeet &nbsp;</h2>
                <p> Where Faces Meet,<br />
                No Matter the Place!</p>

                <div role='button'>
                    <Link to={"/auth"}>Get Started</Link>
                </div>
            </div>
        </div>
    </div>
  )
}
