import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function landing() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useNavigate();
  
  return (
    <div className='landingPageContainer'>
        <nav>
            <div className='navHeader'>
                <h2>Vmeet</h2>
            </div>

            <div className='navList'>
                <p  onClick={() => {
                    const randomString = generateRandomString(5);
                    router(`/${randomString}`);
                }}>Join as Guest</p>

                <p onClick={() =>{
                    router('/auth');
                }} >Register</p>

                <div role='button'
                    onClick={() => {
                        router('/auth');
                    }}>
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
