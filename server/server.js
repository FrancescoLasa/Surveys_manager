'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const { query, validationResult, check, body } = require('express-validator'); // validation middleware
const surveyDao = require('./survey-dao'); // module for accessing the DB
const userDao = require('./user-dao'); // module for accessing the users in the DB
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const path = require('path');

/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, user);
    })
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});


// init express
const app = new express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static("./client/build"));


const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();

  return res.status(401).json({ error: 'not authenticated' });
}


// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie',
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

// POST /sessions 
// login
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err){
      return next(err);
    }
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err){
        return next(err);
      }

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout();
  res.end();
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });;
});


// ONLY FOR TESTING
// app.delete('/api/surveys', async (req, res) => {
//   try {
//     const r = await surveyDao.deleteAll();
//     res.status(200).json({ success: 'delete all' });
//     return;
//   } catch (err) {

//   }
// })

// admin
// get all the answer to a given survey
// GET http://localhost:3001/api/surveyAnswers/quest 1
app.get('/api/surveyAnswers/:surveyName', [
  check('surveyName', 'surveyName must be 1-200 chars').isLength({ min: 1, max: 200 })
], isLoggedIn, async (req, res) => {
  try {
    // validation input
    // input sanitization
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    // se l'admin è l'autore del survey ok
    let _checkAuthor = await surveyDao.checkAuthor(req.params.surveyName, req.user.author);
    if (!_checkAuthor.authorOk) {
      res.status(422).json({ 'the survey is not made by the current admin': _checkAuthor.authorError || _checkAuthor.error });
      return;
    }

    const decodeOptions = (strOptions) => {
      let res = [];
      for (let i = 0; i < strOptions.length; i++) {
        res.push(strOptions[i] === 't' ? true : false);
      }
      return res;
    }

    const _surveyAnswers = await surveyDao.getListOfCompilations(req.params.surveyName);
    if (_surveyAnswers.error) {
      res.status(422).json({ 'error getting the survey answers header': req.params.surveyName, 'msg': _surveyAnswers.error });
      return;
    }
    if (_surveyAnswers.empty) {
      res.status(200).json({ empty: _surveyAnswers.empty });
      return;
    }

    let surveyAnswers = [];
    for (let i = 0; i < _surveyAnswers.length; i++) {
      const survAns = { surveyName: _surveyAnswers[i].SurveyName, utilizzatore: _surveyAnswers[i].Utilizzatore, questions: [] };

      // get the answers for the specific IdCompilazione
      const _answers = await surveyDao.getAnswers(_surveyAnswers[i].IdCompilazione);
      if (_answers.error) {
        res.status(422).json({ 'error getting the survey answers': _surveyAnswers[i], 'msg': _answers.error });
        return;
      }

      for (let j = 0; j < _answers.length; j++) {
        if (_answers[j].Type === 'open') {
          const ans = { id: _answers[j].Id, type: _answers[j].Type, answer: _answers[j].Answer };
          survAns.questions.push(ans);
        } else if (_answers[j].Type === 'close') {
          const ans = { id: _answers[j].Id, type: _answers[j].Type, answer: decodeOptions(_answers[j].Answer) };
          survAns.questions.push(ans);
        } else {
          res.status(422).json({ 'error decoding the answers from the db': _answers[j] });
          return;
        }
      }

      surveyAnswers.push(survAns);
    }

    res.status(200).json({ success: surveyAnswers });
    return;

  } catch (err) {
    res.status(500).json({ 'error': err });
    return;
  }
});

// utilizzatore + admin
// GET http://localhost:3001/api/surveys/quest 1
app.get('/api/surveys/:surveyName', [
  check('surveyName', 'surveyName must be 1-200 chars').isLength({ min: 1, max: 200 })
], async (req, res) => {
  try {
    // input sanitization
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    // se sono loggato devo poter ritornare solo i survey creati dall'admin corrente
    if (req.isAuthenticated()) {
      // se l'admin è l'autore del survey ok
      let _checkAuthor = await surveyDao.checkAuthor(req.params.surveyName, req.user.author);
      if (_checkAuthor.authorError) {
        res.status(422).json({ 'the survey is not made by the current admin': _checkAuthor.authorError });
        return;
      }
    }

    const _survey = await surveyDao.getSurvey(req.params.surveyName);
    if (_survey.error) {
      res.status(422).json({ 'error getting the survey questions': req.params.surveyName, 'msg': _survey.error });
      return;
    }

    const survey = { surveyName: req.params.surveyName, questions: [] };
    for (let i = 0; i < _survey.length; i++) {
      if (_survey[i].Type === 'open') {
        const quest = { question: _survey[i].Question, type: 'open', mandatory: _survey[i].Mandatory === 1, id: _survey[i].Id };
        survey.questions.push(quest);
      } else if (_survey[i].Type === 'close') {
        const quest = { question: _survey[i].Question, type: 'close', min: _survey[i].Min, id: _survey[i].Id, max: _survey[i].Max, answer: [] };

        // get the options from the db
        const _options = await surveyDao.getQuestionOptions(survey.surveyName, quest.id);
        if (_options.error) {
          res.status(422).json({ 'error getting the options for the question': _survey[i], 'msg': _options.error });
          return;
        }
        for (let j = 0; j < _options.length; j++) {
          quest.answer.push(_options[j].Answer);
        }

        survey.questions.push(quest);
      } else {
        res.status(422).json({ 'error decoding the question from the db': _survey[i] });
        return;
      }
    }

    res.status(200).json({ success: survey });
    return;
  } catch (err) {
    res.status(500).json({ 'error': err });
    return;
  }
});

// admin + utilizzatore
app.get('/api/surveys', [], async (req, res) => {

  if (!req.isAuthenticated()) {
    try {

      const _surveys = await surveyDao.getListSurveysUsr();
      if (_surveys.error) {
        res.status(422).json({ 'error getting the surveys': '', 'msg': _surveys.error });
        return;
      }
      if (_surveys.empty) {
        res.status(200).json({ success: [], 'msg': _surveys.empty });
        return;
      }

      let surveys = [];
      for (let i = 0; i < _surveys.length; i++) {
        const survey = { surveyName: _surveys[i].SurveyName, author: _surveys[i].Author };
        surveys.push(survey);
      }

      res.status(200).json({ success: surveys });
      return;
    } catch (err) {
      res.status(500).json({ 'error': err });
      return;
    }
  } else {
    try {

      const _surveys = await surveyDao.getListSurveysAdmin(req.user.author);
      if (_surveys.error) {
        res.status(422).json({ 'error getting the surveys': '', 'msg': _surveys.error });
        return;
      }
      if (_surveys.empty) {
        res.status(200).json({ success: [], 'msg': _surveys.empty });
        return;
      }

      let surveys = [];
      for (let i = 0; i < _surveys.length; i++) {
        const _numComp = await surveyDao.getNumSurveysCompiled(_surveys[i].SurveyName);
        const survey = { surveyName: _surveys[i].SurveyName, author: _surveys[i].Author, numComp: _numComp };
        surveys.push(survey);
      }

      res.status(200).json({ success: surveys });
      return;
    } catch (err) {
      res.status(500).json({ 'error': err });
      return;
    }
  }
});

// utilizzatore
app.post('/api/surveyAnswers', [
  body('surveyName', 'surveyName must be 1-200 chars').isLength({ min: 1, max: 200 }),
  body('utilizzatore', 'utilizzatore must be 1-200 chars').isLength({ min: 1, max: 200 }),
  body('questions', 'invalid anwwers').custom((value) => {
    try {
      if (value.length === 0)
        return false;
      for (let i = 0; i < value.length; i++) {
        //console.log(value[i])
        switch (value[i].type) {
          case 'open':
            if (value[i].mandatory && value[i].answer === '')
              return false;
            break;
          case 'close':
            if (value[i].answer.length === 0 || value[i].answer.length > 10) // max 10 options
              return false;
            if (value[i].min === 1) { // min ans
              let choose = false;
              for (let j = 0; j < value[i].answer.length && !choose; j++) {
                if (value[i].answer[j])
                  choose = true;
              }
              if (!choose)
                return false;
            }
            break;
          default:
            return false;
        }
      }
      return true;
    } catch (err) {
      return false;
    }
  })
], async (req, res) => {
  try {
    // input sanitization
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }


    let surveyAns = { surveyName: req.body.surveyName, utilizzatore: req.body.utilizzatore, questions: req.body.questions };

    const transformOpt = (answer) => {
      let res = '';
      for (let i = 0; i < answer.length; i++)
        res += answer[i] ? 't' : 'f';
      return res;
    }

    const resultCompileHeader = await surveyDao.addSurveyCompiledHeader(surveyAns);
    if (resultCompileHeader.error) {
      res.status(422).json({ 'error creating the header of the compiled survey': surveyAns, 'msg': resultCompileHeader.error });
      return;
    }
    for (let i = 0; i < surveyAns.questions.length; i++) {
      if (surveyAns.questions[i].type === 'close') {
        surveyAns.questions[i].answer = transformOpt(surveyAns.questions[i].answer);
      }
      const resultCompileAnswer = await surveyDao.addSurveyCompiledAnswers(resultCompileHeader.idCompilazione, surveyAns.questions[i]);
      if (resultCompileAnswer.error) {
        res.status(422).json({ 'error inserting an answer of a compiled survey': surveyAns.questions[i], 'msg': resultCompileAnswer.error });
        return;
      }
    }

    res.status(200).json({ success: 'sending survey compiled' });
    return;

  } catch (err) {
    res.status(500).json({ 'error': err });
  }
});

// admin
app.post('/api/surveys', [
  body('surveyName', 'surveyName must be 1-200 chars').isLength({ min: 1, max: 200 }),
  body('questions', 'invalid anwwers').custom((value) => {
    try {
      if (value.length === 0)
        return false;
      for (let i = 0; i < value.length; i++) {
        switch (value[i].type) {
          case 'open':
            break;
          case 'close':
            if (value[i].answer.length === 0 || value[i].answer.length > 10) // max 10 options
              return false;
            if (value[i].min > value[i].answer.length)
              return false;
            if (value[i].min > value[i].max)
              return false;
            break;
          default:
            return false;
        }
      }
      return true;
    } catch (err) {
      return false;
    }
  })
], isLoggedIn, async (req, res) => {

  try {
    // input sanitization
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }


    let survey = {
      surveyName: req.body.surveyName,
      questions: req.body.questions
    };
    const surveyHeader = { surveyName: survey.surveyName, author: req.user.author /* get it from session */ };

    const fixQuestionId = (survey) => {
      for (let i = 0; i < survey.questions.length; i++) {
        survey.questions[i].id = i + 1;
      }
      return survey;
    }

    survey = fixQuestionId(survey);

    const resultHeader = await surveyDao.createSurveyHeader(surveyHeader);
    if (resultHeader.error) {
      res.status(422).json({ 'error creating the header of the survey': surveyHeader, 'msg': resultHeader.error });
      return;
    }
    for (let i = 0; i < survey.questions.length; i++) {
      const resultQuestion = await surveyDao.createSurveyQuestion(survey.surveyName, survey.questions[i]);
      if (resultQuestion.error) {
        res.status(422).json({ 'error adding a question': survey.questions[i], 'msg': resultQuestion.error });
        return;
      }

      // if close question => adding the options
      if (survey.questions[i].type === 'close') {
        const resultQuestionOption = await surveyDao.createQuestionAnswer(survey.surveyName, survey.questions[i].id, survey.questions[i].answer);
        if (resultQuestionOption.error) {
          res.status(422).json({ 'error adding options to the question': survey.questions[i], 'msg': resultQuestionOption.error });
          return;
        }
      }
    }

    res.status(200).json({ success: 'creating a survey' });
    return;

  } catch (err) {
    res.status(500).json({ 'error': err });
  }

});


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});