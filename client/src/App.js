import './App.css';
import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toast, Col, Row, Alert } from 'react-bootstrap';

import { NavbarCst } from './Navbar.js';
import { SurveyContainerList, SurveyContainer } from './SurveyContainer';
import { Ctx } from './Context';
import { SurveyCreate } from './SurveyAdmin.js';
import { LoginForm } from './LoginForm.js';
import {API} from './API.js'


/*
admin:
/login
/create
/ -> list of questionary pubblicati dall'admin
/questionaryId: -> stat del questionario

/ not logged
/ -> list of questionari
/questionaryId: -> compile questionary
*/


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const [surveys, setSurveys] = useState([]);
  const [currSurvey, setCurrSurvey] = useState();
  const [currSurveyName, setCurrSurveyName] = useState();

  // to ask refresh of data to the server
  const [flagDirty, setFlagDirty] = useState(true);
  // to signal error
  const [error, setError] = useState();

  const [welcomeMessage, setWelcomeMessage] = useState('');


  // update list of survey: on start + on request (dirty == true) + on login/logout
  useEffect(() => {
    const getSurveys = async () => {
      //   if (loggedIn) -> il server ritorna la lista appropriate a seconda se la sessione è loggata o meno
      let _surveys = [];
      try {
        _surveys = await API.getSurveys();
      } catch (err) {
        setError('error fetch from server ' + err);
      }
      setSurveys(_surveys);
    };

    setLoading(true);
    getSurveys().then(() => setLoading(false)).catch(() => setLoading(false));

  }, [flagDirty, loggedIn]);

  // update currSurvey: on currSurveyName change + on start + on request
  useEffect(() => {
    const getSurvey = async (surveyName) => {
      let _currSurvey;
      try {
        _currSurvey = await API.getSurvey(surveyName);
      } catch (err) {
        setError('error fetch from server ' + err);
      }
      setCurrSurvey(_currSurvey);
    };

    if (currSurveyName) { // only if a surveyName is specified
      setLoading(true);
      getSurvey(currSurveyName).then(() => setLoading(false)).catch(() => setLoading(false));
    }

  }, [currSurveyName, flagDirty]);

  useEffect(()=> {
    const checkAuth = async() => {
      try {
        await API.getUserInfo();
        setLoggedIn(true);
      } catch(err) {
        // console.error(err.error);
      }
    };
    checkAuth();
  }, []);


  const doLogIn = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setWelcomeMessage({ msg: `Welcome, ${user}!`, type: 'bg-success' });
    } catch (err) {
      setWelcomeMessage({ msg: `Error: ${err}`, type: 'bg-danger' });
    }
  }

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setWelcomeMessage('');
  }


  return <Router>
    <Ctx.Provider value={[loggedIn, loading, surveys, setCurrSurveyName, currSurvey, currSurveyName, setFlagDirty]}>
      {/* different navbar depending type ot user */}
      <NavbarCst loggedIn={loggedIn} doLogOut={doLogOut} setFlagDirty={setFlagDirty}></NavbarCst>{/* to finish */}
      {welcomeMessage ? <>
        <Toast className={welcomeMessage.type} delay={2000} onClose={() => { setWelcomeMessage('') }} style={{
          position: 'absolute',
          top: "8%",
          right: "50%",
        }} autohide>
          <Toast.Header>
            <strong className="me-auto">{welcomeMessage.msg}</strong>
          </Toast.Header>
        </Toast>
      </> : <>
      </>}
      {error ? <Alert variant='danger' onClose={() => setError(0)} dismissible className="mt-4">{error}</Alert>:<></>}
      <Row style={{ height: "100%", width: "100%", padding: 4 }}>
        {/* links. Start from more specific link */}
        <Switch>
          <Route path="/login" render={() => {
            return loggedIn ? <Redirect to="/"/> : <LoginForm doLogIn={doLogIn}></LoginForm>
          }} />

          <Route path="/create" render={() => {
            return loggedIn ? <SurveyCreate setFlagDirty={setFlagDirty} /> :
              <Redirect to="/login" /> // we need login to create a survey
          }} />

          <Route path="/surveys/:surveyName" render={({ match }) => {
            return <Col>
              <SurveyContainer match={match} />
            </Col>
          }} />

          <Route path='/' render={() => {
            // here we don't strictly need login: if He was an admin I see only its surveys
            // else see all the surveys but it cannot see a buttom to the stats
            return <Col>
              <SurveyContainerList />
            </Col>
          }} />
        </Switch>
      </Row>
    </Ctx.Provider>
  </Router>
}

export default App;
