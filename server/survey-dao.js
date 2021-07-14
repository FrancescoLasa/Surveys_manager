'use strict';
/* Data Access Object (DAO) module for accessing tasks */

const db = require('./db');



// PUT A NEW SURVEY INTO THE DB
// NB: these 3 functions not check the consistency, so the server must check that everything that is done is ok
// e.g. adding a question to an already existing survey
// add a new survey header
// { surveyName: "quest 1", author: "admin1" },
exports.createSurveyHeader = (survey) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'INSERT INTO SURVEYS(SurveyName, Author) VALUES(?, ?)';
            db.run(sql, [survey.surveyName, survey.author], function (err1) {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                resolve(this.lastID); // num of row inserted === 1
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
};
// add a new survey question
// {question: "domanda 1", type: "open", mandatory: true, id: 1}
// {question: "domanda 5", type: "close", min: 0, max: 2, id: 5}
exports.createSurveyQuestion = (surveyName, question) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'INSERT INTO SURVEY_QUESTS(SurveyName, Id, Question, Type, Min, Max, Mandatory) VALUES(?, ?, ?, ?, ?, ?, ?)';
            if (question.type === 'open') {
                db.run(sql, [surveyName, question.id, question.question, 'open', -1, -1, question.mandatory], function (err1) {
                    if (err1) {
                        reject({ error: err1 });
                        return;
                    }
                    resolve(this.lastID); // num of row inserted === 1
                    return;
                });
            } else if (question.type === 'close') {
                db.run(sql, [surveyName, question.id, question.question, 'close', question.min, question.max, -1], function (err1) {
                    if (err1) {
                        reject({ error: err1 });
                        return;
                    }
                    resolve(this.lastID); // num of row inserted === 1
                    return;
                });
            } else {
                reject({ error: 'invalid question type' });
                return;
            }
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
};
// add options to a specifc: (surveyName, id)
// answer: ["risposta 1", "risposta 2", "risposta 3"]
exports.createQuestionAnswer = (surveyName, questionId, answers) => {
    return new Promise(async (resolve, reject) => {
        try {
            for (let i = 0; i < answers.length; i++) {

                const sql = 'INSERT INTO QUEST_OPTS(SurveyName, Id, Incr, Answer) VALUES(?, ?, ?, ?)';

                db.run(sql, [surveyName, questionId, i, answers[i]], function (err1) {
                    if (err1) {
                        reject({ error: err1 });
                        return;
                    }
                    if (this.lastID != 1) {
                        reject({ error: 'we should create a single row' });
                        return;
                    }
                    // resolve(this.lastID); // num of row inserted === 1
                    // return;
                });
            }
            resolve(1); // success
            return;
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
};


// GET A SURVEY FROM THE DB (not the answers)
// get the stucture of the survey (not the answers for the closed questions)
exports.getSurvey = (surveyName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT * FROM SURVEY_QUESTS WHERE SurveyName=? ORDER BY Id';
            db.all(sql, [surveyName], (err1, rows) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (rows == undefined || rows.length === 0) {
                    resolve({ error: 'No questions for this survey' });
                    return;
                }
                resolve(rows);
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}
// get the options for a close question
exports.getQuestionOptions = (surveyName, id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT * FROM QUEST_OPTS WHERE SurveyName=? AND Id=?';
            db.all(sql, [surveyName, id], (err1, rows) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (rows == undefined || rows.length === 0) {
                    resolve({ error: 'No options for this question' });
                    return;
                }
                resolve(rows);
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}


// GET LIST OF SURVEYS
exports.getListSurveysUsr = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT * FROM SURVEYS';
            db.all(sql, (err1, rows) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (rows == undefined || rows.length === 0) {
                    resolve({ empty: 'No surveys in the db' });
                    return;
                }
                resolve(rows);
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}

// GET LIST OF SURVEYS + # COMPILATION
exports.getListSurveysAdmin = (admin) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT SurveyName, Author FROM SURVEYS WHERE Author=?';
            db.all(sql, [admin], (err1, rows) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (rows == undefined || rows.length === 0) {
                    resolve({ empty: 'No surveys in the db' });
                    return;
                }
                resolve(rows);
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}
exports.getNumSurveysCompiled = (surveyName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT COUNT(*) as NumComp FROM SURVEY_COMPS WHERE SurveyName=?';
            db.get(sql, [surveyName], (err1, row) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (row == null ) {
                    resolve({ error: 'count(*) gets NULL' });
                    return;
                }
                resolve(row['NumComp']);
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}


// CHECK IF A SURVEY IS MADE BY A SPECIFIC ADMIN
exports.checkAuthor = (surveyName, author) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT * FROM SURVEYS WHERE SurveyName=? AND Author=?';
            db.all(sql, [surveyName, author], (err1, rows) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (rows == undefined || rows.length === 0) {
                    resolve({ authorError: 'Invalid author' });
                    return;
                }
                resolve({authorOk:'Correct author'});
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}


// GET LIST OF ANWERS TO A GIVEN SURVEY
exports.getListOfCompilations = (surveyName) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT * FROM SURVEY_COMPS WHERE SurveyName=?';
            db.all(sql, [surveyName], (err1, rows) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (rows == undefined || rows.length === 0) {
                    resolve({ empty: 'No compilation for this survey' });
                    return;
                }
                resolve(rows);
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}
// get list of answers for a specific compilation (idCompilazione)
exports.getAnswers = (idCompilazione) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'SELECT * FROM SURVEY_ANS_COMP WHERE IdCompilazione=? ORDER BY Id';
            db.all(sql, [idCompilazione], (err1, rows) => {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                if (rows == undefined || rows.length === 0) {
                    resolve({ error: 'No answers for this compilation' });
                    return;
                }
                resolve(rows);
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
}


// ADD A COMPILED SURVEY
// add a survey compiled header
// {surveyName: "quest 1", utilizzatore: "pippo", ...list of answers...}
const getMaxIdCompilazione = () => {
    return new Promise((resolve, reject) => {
        const sqlId = 'SELECT MAX(IdCompilazione) AS max FROM SURVEY_COMPS';
        db.get(sqlId, (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row === null ? 0 : row['max']);
            return;
        });
    });
};
exports.addSurveyCompiledHeader = (surveyComp) => {
    return new Promise(async (resolve, reject) => {
        try {
            const idCompilazione = await getMaxIdCompilazione();

            const sql = 'INSERT INTO SURVEY_COMPS(IdCompilazione, SurveyName, Utilizzatore) VALUES(?, ?, ?)';
            db.run(sql, [idCompilazione+1, surveyComp.surveyName, surveyComp.utilizzatore], function (err1) {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                resolve({idCompilazione:idCompilazione+1}); // num of row inserted === 1
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
};
// add a survey compiled
// {id: 1, answer: 'ans1', type: 'open'}
// {id: 3, type: 'close', answer: [true, false, false] -> 'tff'}
exports.addSurveyCompiledAnswers = (idCompilazione, answer) => {
    return new Promise(async (resolve, reject) => {
        try {
            const sql = 'INSERT INTO SURVEY_ANS_COMP(IdCompilazione, Id, Type, Answer) VALUES(?, ?, ?, ?)';
            db.run(sql, [idCompilazione, answer.id, answer.type, answer.answer], function (err1) {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
                resolve(this.lastID); // num of row inserted === 1
                return;
            });
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
};




// CLEAR ALL THE DB
exports.deleteAll = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let sql = 'DELETE FROM QUEST_OPTS';
            db.run(sql, [], function (err1) {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
            });

            sql = 'DELETE FROM SURVEY_QUESTS';
            db.run(sql, [], function (err1) {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
            });

            sql = 'DELETE FROM SURVEYS';
            db.run(sql, [], function (err1) {
                if (err1) {
                    reject({ error: err1 });
                    return;
                }
            });

            resolve(1); // success
            return;
        } catch (err) {
            reject({ error: err });
            return;
        }
    });
};