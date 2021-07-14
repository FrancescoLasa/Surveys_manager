const BASEURL = '/api/';


// POST /api/surveys
async function addSurvey(survey) {
    return new Promise((resolve, reject) => {
        fetch(BASEURL + 'surveys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(survey)
        })
            .then((response) => {
                if(response.ok){
                    resolve(response.success);
                }else{
                    response.json()
                        .then((objResp) => reject({error: objResp,request: 'POST' + BASEURL + 'surveys'})) // err msg is in the body of the response
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'POST'+ BASEURL + 'surveys'}));
                }
            }).catch((error) => {
                reject({error:'cannot communicate with the server', msg: error ,request: 'POST' + BASEURL + 'surveys'});
            })
    })
};

// POST /api/surveyAnswers
async function addSurveyAnswers(surveyAns){
    return new Promise((resolve, reject) => {
        fetch(BASEURL + 'surveyAnswers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(surveyAns)
        })
            .then((response) => {
                if(response.ok){
                    resolve(response.success);
                }else{
                    response.json()
                        .then((objResp) => reject({error: objResp,request: 'POST' + BASEURL + 'surveyAnswers'})) // err msg is in the body of the response
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'POST'+ BASEURL + 'surveyAnswers'}));
                }
            }).catch((error) => {
                reject({error:'cannot communicate with the server', msg: error ,request: 'POST' + BASEURL + 'surveyAnswers'});
            })
    })
}

// GET /api/surveys
async function getSurveys() {
    return new Promise((resolve, reject) => {
        fetch(BASEURL + 'surveys')
            .then((response) => {
                if(response.ok){
                    response.json()
                        .then((survs) => resolve(survs.success))
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'GET' + BASEURL + 'surveys'}));
                }else{
                    response.json()
                        .then((objResp) => reject({error: objResp,request: BASEURL + 'surveys'})) // err msg is in the body of the response
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'GET' + BASEURL + 'surveys'}));
                }
            }).catch((error) => {
                reject({error:'cannot communicate with the server', msg: error ,request: BASEURL + 'surveys'});
            })
    })
};

// GET /api/surveys/:surveyName
async function getSurvey(surveyName) {
    return new Promise((resolve, reject) => {
        fetch(BASEURL + 'surveys/' + surveyName)
            .then((response) => {
                if(response.ok){
                    response.json()
                        .then((survs) => resolve(survs.success))
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'GET' + BASEURL + 'surveys/' + surveyName}));
                }else{
                    response.json()
                        .then((objResp) => reject({error: objResp,request: BASEURL + 'surveys'})) // err msg is in the body of the response
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'GET' + BASEURL + 'surveys/' + surveyName}));
                }
            }).catch((error) => {
                reject({error:'cannot communicate with the server', msg: error ,request: BASEURL + 'surveys/' + surveyName});
            })
    })
};

// GET /api/surveyAnswers/:surveyName
async function getSurveyAnswers(surveyName) {
    return new Promise((resolve, reject) => {
        fetch(BASEURL + 'surveyAnswers/' + surveyName)
            .then((response) => {
                if(response.ok){
                    response.json()
                        .then((survs) => {
                            if(survs.success)
                                resolve(survs.success);
                            reject(survs.empty);
                        })
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'GET' + BASEURL + 'surveyAnswers/' + surveyName}));
                }else{
                    response.json()
                        .then((objResp) => reject({error: objResp,request: BASEURL + 'surveyAnswers'})) // err msg is in the body of the response
                        .catch((err) => reject({error: 'parsing server response', rawErr: response, request: 'GET' + BASEURL + 'surveyAnswers/' + surveyName}));
                }
            }).catch((error) => {
                reject({error:'cannot communicate with the server', msg: error ,request: BASEURL + 'surveyAnswers/' + surveyName});
            })
    })
};


async function logIn(credentials) {
    let response = await fetch( BASEURL + 'sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
  
    if(response.ok) {
      const user = await response.json();
      return user.username;
    }
    else {
      try {
        const errDetail = await response.json();
        //console.log(errDetail);
        throw errDetail.message;
      }
      catch(err) {
        throw err;
      }
    }
  }
  
  async function logOut() {
    await fetch( BASEURL + 'sessions/current', { method: 'DELETE' });
  }
  
  async function getUserInfo() {
    const response = await fetch(BASEURL + 'sessions/current');
    const userInfo = await response.json();
    if (response.ok) {
      return userInfo;
    } else {
      throw userInfo;  // an object with the error coming from the server
    }
  }



const API = {addSurvey, getSurveys, getSurvey, addSurveyAnswers, getSurveyAnswers, logIn, logOut, getUserInfo};
export {API};