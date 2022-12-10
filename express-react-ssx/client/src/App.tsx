// @ts-nocheck

import React, { useState, useEffect } from 'react'
import { SSX } from '@spruceid/ssx';
import './App.css';
import getSSXConfig from './ssx.config';


function AccountInfo({ address, delegator }: { address: string, delegator?: string }) {
  return (
    <div className="App-account-info">
      <h2>
        Account Info
      </h2>
      {
        address &&
        <p>
          <b>
            Address
          </b>
          <br />
          <code>
            {address}
          </code>
        </p>
      }
    </div>
  );
};


function App() {
  const [backendData, setBackendData] = useState([{}])
  const [logged, setLogged] = useState('')


  //login

  const onSubmitHandle = (e) => {
    const data = new FormData(e.target)
    e.preventDefault();
    const user = {}

    for (let entry of data.entries()) {
      user[entry[0]] = entry[1]
    }
    fetch('/in', {
      method: 'POST',
      body: data
    })
      .then(res => res.text())
      .then(txt => {
        if (txt == "OK") {
          setLogged('true');
          console.log('logged in!')
        }

        else { alert(txt); }
        console.log(logged)
      })
      .catch(err => console.error(err));
    return false;
  }


  useEffect(() => {
    fetch('/api')
      .then((res) => res.json())
      .then((data) => {
        setBackendData(data)
      })
  }, [])

  const console1 = () => {
    console.log(backendData)
  }

  // ssx stuff!

  const [ssxProvider, setSSX] = useState<SSX | null>(null);

  const ssxHandler = async () => {
    const ssxConfig = await getSSXConfig();
    const ssx = new SSX(ssxConfig);
    await ssx.signIn();
    setSSX(ssx);
    (window as any).ssx = ssx;
  };

  const ssxLogoutHandler = async () => {
    ssxProvider?.signOut();
    setSSX(null);
  };

  return (
    <div className="App">
      <div className="App-header">
        <div className="App-title">
          <h1>SSX Example Dapp</h1>
          <p>Connect and sign in with your Ethereum account</p>
          <div className="App-content">
            {
              ssxProvider ?
                <>
                  <button onClick={ssxLogoutHandler}>
                    SIGN OUT
                  </button>
                  <AccountInfo
                    address={ssxProvider?.address() || ''}
                  />
                </> :
                <button onClick={ssxHandler}>
                  SIGN-IN WITH ETHEREUM
                </button>
            }
          </div>
        </div>



        <div>
          {!logged ?
            <>
              <form onSubmit={onSubmitHandle}>
                <input type="email" name="email" value="jon@doe.com" /> <br />
                <input type="password" name='password' value='111111' />
                <button type='submit'>submit</button>
              </form>
            </>
            :
            <>
              <form method="post" action="/out">
                <button type='submit'>sign out</button>
              </form>
            </>
          }
        </div>
      </div>
    </div>
  );
}




export default App;
